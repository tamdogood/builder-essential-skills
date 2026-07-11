from __future__ import annotations

import gzip
import json
import webbrowser
from pathlib import Path

import pandas as pd

from .dataset import load, load_agents, work_dir


def _us(ts, origin) -> int:
    return int((pd.Timestamp(ts) - origin).total_seconds() * 1_000_000)


def create(data_dir=None) -> Path:
    out = work_dir(data_dir)
    df = load(out)
    agents = load_agents(out)["agents"]
    origin = df.ts.min()
    trace = {"displayTimeUnit": "ms", "traceEvents": []}
    ev = trace["traceEvents"]
    ev.append({"ph": "M", "pid": 1, "tid": 0, "name": "process_name", "args": {"name": "Claude Code session"}})
    tids = {}
    for idx, agent in enumerate(agents, 1):
        tids[agent["id"]] = {"activity": idx * 10, "prompts": idx * 10 + 1, "tokens": idx * 10 + 2}
        for key, suffix in [("activity", "activity"), ("prompts", "prompts"), ("tokens", "tokens + estimated cost")]:
            ev.append({"ph": "M", "pid": 1, "tid": tids[agent["id"]][key], "name": "thread_name", "args": {"name": f"{agent['name']} — {suffix}"}})
    cumulative = {a["id"]: {"tokens": 0, "cost": 0.0} for a in agents}
    for _, row in df.sort_values("ts").iterrows():
        if row.event_type in {"inference", "tool", "user_prompt"}:
            tid = tids[row.agent_id]["prompts" if row.event_type == "user_prompt" else "activity"]
            name = row.tool_name if row.event_type == "tool" else (str(row.text)[:100] if row.event_type == "user_prompt" else f"inference ({row.model})")
            ev.append({"ph": "X", "pid": 1, "tid": tid, "ts": _us(row.ts, origin), "dur": max(1, int(row.duration_ms * 1000)), "name": name or row.event_type, "cat": row.event_type, "args": {"wall_utc": row.ts.isoformat(), "agent": row.agent_name, "input": str(row.input_preview)[:2000], "output": str(row.output_preview)[:2000], "error": bool(row.is_error), "estimated_cost_usd": float(row.estimated_cost_usd)}})
        if row.event_type == "inference":
            tokens = int(row.input_tokens + row.cache_read_input_tokens + row.cache_creation_input_tokens + row.output_tokens)
            cumulative[row.agent_id]["tokens"] += tokens
            cumulative[row.agent_id]["cost"] += float(row.estimated_cost_usd)
            ev.append({"ph": "C", "pid": 1, "tid": tids[row.agent_id]["tokens"], "ts": _us(row.end_ts, origin), "name": "usage", "args": cumulative[row.agent_id].copy()})
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
        def add(items):
            for item in items:
                try:
                    start, end = pd.to_datetime(item["start_ts"], utc=True), pd.to_datetime(item["end_ts"], utc=True)
                except (KeyError, ValueError):
                    continue
                ev.append({"ph": "X", "pid": 1, "tid": tid, "ts": _us(start, origin), "dur": max(1, _us(end, start)), "name": item.get("title", "phase"), "cat": "toc", "args": {"summary": item.get("summary", "")}})
                add(item.get("steps", []))
        add(toc.get("phases", []))
    path = out / "trace.json.gz"
    with gzip.open(path, "wt", encoding="utf-8") as fh:
        json.dump(trace, fh, separators=(",", ":"))
    return path


def open_ui() -> str:
    webbrowser.open("https://ui.perfetto.dev")
    return "Opened https://ui.perfetto.dev — load trace.json.gz from the parsed session directory. Review the trace for sensitive paths or text before sharing."
