from __future__ import annotations

import gzip
import json
import webbrowser
from pathlib import Path

import pandas as pd

from .dataset import load, load_agents, work_dir

TOC_COLORS = ["rail_response", "rail_animation", "rail_idle", "cq_build_running", "cq_build_passed", "cq_build_failed"]


def _us(ts, origin) -> int:
    return int((pd.Timestamp(ts) - origin).total_seconds() * 1_000_000)


def _clip(value, limit: int = 90) -> str:
    text = " ".join(str(value or "").split())
    return text[: limit - 3] + "..." if len(text) > limit else text


def _duration_seconds(row) -> float:
    return round(float(row.duration_ms or 0) / 1000, 3)


def _token_total(row) -> int:
    return int(row.input_tokens + row.cache_read_input_tokens + row.cache_creation_input_tokens + row.output_tokens)


def _event_name(row) -> str:
    if row.event_type == "user_prompt":
        return "Prompt: " + (_clip(row.text, 70) or "user prompt")
    if row.event_type == "tool":
        label = _clip(row.tool_name or "tool", 70)
        return f"Failed: {label}" if bool(row.is_error) else label
    if row.event_type == "inference":
        return "Inference: " + (_clip(row.model, 60) or "model")
    return _clip(row.event_type, 70)


def _event_color(row) -> str:
    if bool(row.is_error):
        return "terrible"
    if row.event_type == "user_prompt":
        return "rail_response"
    if row.event_type == "inference":
        return "thread_state_iowait"
    if row.event_type == "tool":
        return "cq_build_running" if bool(row.concurrent) else "cq_build_passed"
    return "generic_work"


def create(data_dir=None) -> Path:
    out = work_dir(data_dir)
    df = load(out)
    metadata = load_agents(out)
    agents = metadata["agents"]
    provider = metadata.get("provider", "unknown").title()
    origin = df.ts.min()
    trace = {"displayTimeUnit": "ms", "traceEvents": []}
    ev = trace["traceEvents"]
    ev.append({"ph": "M", "pid": 1, "tid": 0, "name": "process_name", "args": {"name": f"{provider} session profile"}})
    ev.append({"ph": "M", "pid": 1, "tid": 1, "name": "thread_name", "args": {"name": "Session overview"}})
    tids = {}
    for idx, agent in enumerate(agents, 1):
        tids[agent["id"]] = {"activity": idx * 10, "prompts": idx * 10 + 1, "tokens": idx * 10 + 2}
        for key, suffix in [("activity", "work timeline"), ("prompts", "prompt trail"), ("tokens", "usage tokens + cost")]:
            ev.append({"ph": "M", "pid": 1, "tid": tids[agent["id"]][key], "name": "thread_name", "args": {"name": f"{agent['name']} — {suffix}"}})
    inf = df[df.event_type == "inference"]
    tools = df[df.event_type == "tool"]
    prompts = df[(df.agent_id == "main") & (df.event_type == "user_prompt")]
    overview_name = f"{provider} session: {len(agents)} agents, {len(tools)} tool calls"
    if not tools.empty and tools.is_error.any():
        overview_name += f", {int(tools.is_error.sum())} failures"
    ev.append({
        "ph": "X",
        "pid": 1,
        "tid": 1,
        "ts": 0,
        "dur": max(1, _us(df.end_ts.max(), origin)),
        "name": overview_name,
        "cat": "overview",
        "cname": "rail_idle",
        "args": {
            "provider": metadata.get("provider", "unknown"),
            "session_id": metadata.get("session_id", ""),
            "prompts": int(len(prompts)),
            "agents": int(len(agents)),
            "tool_calls": int(len(tools)),
            "tool_failures": int(tools.is_error.sum()) if not tools.empty else 0,
            "tokens": int(inf[["input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens"]].sum().sum()) if not inf.empty else 0,
            "estimated_cost_usd": round(float(inf.estimated_cost_usd.sum()), 6) if not inf.empty else 0.0,
        },
    })
    cumulative = {a["id"]: {"tokens": 0, "cost": 0.0} for a in agents}
    for _, row in df.sort_values("ts").iterrows():
        if row.event_type in {"inference", "tool", "user_prompt"}:
            tid = tids[row.agent_id]["prompts" if row.event_type == "user_prompt" else "activity"]
            ev.append({"ph": "X", "pid": 1, "tid": tid, "ts": _us(row.ts, origin), "dur": max(1, int(row.duration_ms * 1000)), "name": _event_name(row), "cat": row.event_type, "cname": _event_color(row), "args": {"wall_utc": row.ts.isoformat(), "agent": row.agent_name, "duration_s": _duration_seconds(row), "input": str(row.input_preview)[:2000], "output": str(row.output_preview)[:2000], "text": str(row.text)[:2000], "error": bool(row.is_error), "concurrent": bool(row.concurrent), "tokens": _token_total(row), "estimated_cost_usd": float(row.estimated_cost_usd)}})
        if row.event_type == "inference":
            tokens = _token_total(row)
            cumulative[row.agent_id]["tokens"] += tokens
            cumulative[row.agent_id]["cost"] += float(row.estimated_cost_usd)
            ev.append({"ph": "C", "pid": 1, "tid": tids[row.agent_id]["tokens"], "ts": _us(row.end_ts, origin), "name": "usage tokens", "args": {"tokens": cumulative[row.agent_id]["tokens"]}})
            ev.append({"ph": "C", "pid": 1, "tid": tids[row.agent_id]["tokens"], "ts": _us(row.end_ts, origin), "name": "usage cost", "args": {"estimated_cost_usd": round(cumulative[row.agent_id]["cost"], 6)}})
    # Connect parent spawn -> child start and child completion -> parent result.
    for idx, agent in enumerate(agents):
        if agent["id"] == "main" or not agent.get("spawn_tool_use_id"):
            continue
        parent = df[(df.event_type == "tool") & (df.tool_use_id == agent["spawn_tool_use_id"])]
        child = df[df.agent_id == agent["id"]]
        if parent.empty or child.empty:
            continue
        spawn, child_start, child_end = parent.iloc[0], child.ts.min(), child.end_ts.max()
        flow_id = f"spawn-{idx}"
        ev.extend([
            {"ph": "s", "pid": 1, "tid": tids[spawn.agent_id]["activity"], "ts": _us(spawn.ts, origin), "name": "spawn", "id": flow_id},
            {"ph": "f", "pid": 1, "tid": tids[agent["id"]]["activity"], "ts": _us(child_start, origin), "name": "spawn", "id": flow_id, "bp": "e"},
            {"ph": "s", "pid": 1, "tid": tids[agent["id"]]["activity"], "ts": _us(child_end, origin), "name": "completion", "id": f"done-{idx}"},
            {"ph": "f", "pid": 1, "tid": tids[spawn.agent_id]["activity"], "ts": _us(spawn.end_ts, origin), "name": "completion", "id": f"done-{idx}", "bp": "e"},
        ])
    toc_path = out / "toc.json"
    if toc_path.exists():
        toc = json.loads(toc_path.read_text())
        tid = 2
        ev.append({"ph": "M", "pid": 1, "tid": tid, "name": "thread_name", "args": {"name": "Table of contents"}})
        def add(items, depth=0):
            for item in items:
                try:
                    start, end = pd.to_datetime(item["start_ts"], utc=True), pd.to_datetime(item["end_ts"], utc=True)
                except (KeyError, ValueError):
                    continue
                ev.append({"ph": "X", "pid": 1, "tid": tid, "ts": _us(start, origin), "dur": max(1, _us(end, start)), "name": item.get("title", "phase"), "cat": "toc", "cname": TOC_COLORS[depth % len(TOC_COLORS)], "args": {"summary": item.get("summary", ""), "duration_s": round(_us(end, start) / 1_000_000, 3)}})
                add(item.get("steps", []), depth + 1)
        add(toc.get("phases", []))
    path = out / "trace.json.gz"
    with gzip.open(path, "wt", encoding="utf-8") as fh:
        json.dump(trace, fh, separators=(",", ":"))
    return path


def open_ui() -> str:
    webbrowser.open("https://ui.perfetto.dev")
    return "Opened https://ui.perfetto.dev — load trace.json.gz from the parsed session directory. Review the trace for sensitive paths or text before sharing."
