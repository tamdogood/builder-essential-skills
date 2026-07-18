from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd

from .discover import hermes_family, detect_provider, resolve_session, session_id

# Reference rates from the source specification, USD per million tokens.
TRANSCRIPT_PRICE = {"input": 15.0, "cache_read": 1.5, "cache_write": 18.75, "output": 75.0}
# Public standard API rates per million tokens, verified 2026-07-11 against
# developers.openai.com/api/docs/models/. Hermes billing can differ.
HERMES_PRICE = {
    "gpt-5.6-sol": {"input": 5.0, "cache_read": 0.5, "cache_write": 6.25, "output": 30.0},
    "gpt-5.6-terra": {"input": 2.5, "cache_read": 0.25, "cache_write": 3.125, "output": 15.0},
    "gpt-5.6-luna": {"input": 1.0, "cache_read": 0.1, "cache_write": 1.25, "output": 6.0},
    "gpt-5.6": {"input": 5.0, "cache_read": 0.5, "cache_write": 6.25, "output": 30.0},
    "gpt-5.4": {"input": 2.5, "cache_read": 0.25, "cache_write": 3.125, "output": 15.0},
    "gpt-5": {"input": 1.25, "cache_read": 0.125, "cache_write": 1.5625, "output": 10.0},
}
OPAQUE = re.compile(r"(?<![A-Za-z0-9])[A-Za-z0-9_+\-/=]{40,}")
AUTH = re.compile(r"(?i)(authorization|cookie|x-api-key)([\"' ]*[:=][\"' ]*)([^\s,;}]+)")


def sanitize(value: Any, limit: int = 2000) -> str:
    if value is None:
        return ""
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, default=str)
    text = AUTH.sub(r"\1\2[REDACTED]", text)
    text = OPAQUE.sub("[REDACTED_TOKEN]", text)
    return text[:limit]


def _ts(value: Any) -> pd.Timestamp:
    return pd.to_datetime(value, utc=True, errors="coerce")


def _price(provider: str, model: str) -> dict | None:
    if provider == "transcript":
        return TRANSCRIPT_PRICE
    for prefix, price in HERMES_PRICE.items():
        if model == prefix or re.fullmatch(re.escape(prefix) + r"-\d{4}-\d{2}-\d{2}", model):
            return price
    return None


def _cost(usage: dict, provider: str = "transcript", model: str = "") -> float:
    price = _price(provider, model)
    if not price:
        return 0.0
    long_context = provider == "hermes" and model.startswith(("gpt-5.4", "gpt-5.6")) and usage.get("input_tokens", 0) + usage.get("cache_read_input_tokens", 0) > 272_000
    input_multiplier = 2.0 if long_context else 1.0
    output_multiplier = 1.5 if long_context else 1.0
    return (
        usage.get("input_tokens", 0) * price["input"] * input_multiplier
        + usage.get("cache_read_input_tokens", 0) * price["cache_read"] * input_multiplier
        + usage.get("cache_creation_input_tokens", 0) * price["cache_write"]
        + usage.get("output_tokens", 0) * price["output"] * output_multiplier
    ) / 1_000_000


def _records(path: Path) -> list[dict]:
    rows = []
    with path.open(errors="replace") as fh:
        for line_no, line in enumerate(fh, 1):
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            row["_line_no"] = line_no
            rows.append(row)
    return rows


def _agent_files(main: Path) -> list[tuple[str, Path, dict]]:
    if detect_provider(main) == "hermes":
        family = hermes_family(main)
        root_id = family[0][0]
        found = []
        for index, (thread_id, path, session_meta) in enumerate(family):
            spawn = session_meta.get("source", {}).get("subagent", {}).get("thread_spawn", {}) if isinstance(session_meta.get("source"), dict) else {}
            found.append(("main" if index == 0 else thread_id, path, {
                "name": "main" if index == 0 else spawn.get("agent_nickname", thread_id),
                "agentType": "main" if index == 0 else spawn.get("agent_role", "subagent"),
                "description": "",
                "spawnDepth": 0 if index == 0 else spawn.get("depth", 1),
                "parentThreadId": "" if index == 0 else spawn.get("parent_thread_id", root_id),
                "threadId": thread_id,
                "rootThreadId": root_id,
            }))
        return found
    found: list[tuple[str, Path, dict]] = [("main", main, {"name": "main", "agentType": "main", "spawnDepth": 0})]
    side = main.parent / main.stem / "subagents"
    if not side.exists():
        return found
    for path in sorted(side.glob("agent-*.jsonl")):
        meta_path = path.with_suffix(".meta.json")
        try:
            meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
        except (OSError, json.JSONDecodeError):
            meta = {}
        found.append((path.stem, path, meta))
    return found


def _content_blocks(row: dict) -> list[dict]:
    content = row.get("message", {}).get("content", [])
    if isinstance(content, str):
        return [{"type": "text", "text": content}]
    return content if isinstance(content, list) else []


def parse(session: str | Path, out_dir: str | Path | None = None) -> Path:
    main = resolve_session(session)
    provider = detect_provider(main)
    parsed_session_id = session_id(main)
    out = Path(out_dir).expanduser() if out_dir else Path(os.environ.get("SESSION_DATA_DIR", Path.home() / ".cache" / "session-profiler" / parsed_session_id))
    out.mkdir(parents=True, exist_ok=True)

    files = _agent_files(main)
    raw_by_agent = {agent_id: _records(path) for agent_id, path, _ in files}
    spawn_owner: dict[str, str] = {}
    for agent_id, rows in raw_by_agent.items():
        for row in rows:
            if provider == "transcript":
                for block in _content_blocks(row):
                    if block.get("type") == "tool_use" and block.get("name") in {"Agent", "Task"}:
                        spawn_owner[block.get("id", "")] = agent_id
    id_map = {meta.get("threadId"): agent_id for agent_id, _, meta in files}

    agents = []
    events: list[dict] = []
    for agent_id, path, meta in files:
        rows = raw_by_agent[agent_id]
        timestamps = [_ts(r.get("timestamp")) for r in rows]
        timestamps = [t for t in timestamps if not pd.isna(t)]
        parent_id = spawn_owner.get(meta.get("toolUseId", ""), "" if agent_id == "main" else "main")
        spawn_tool_id = meta.get("toolUseId", "")
        if provider == "hermes" and agent_id != "main":
            parent_id = id_map.get(meta.get("parentThreadId"), "main")
            child_thread = meta.get("threadId", "")
            for row in raw_by_agent.get(parent_id, []):
                payload = row.get("payload", {})
                if payload.get("type") in {"custom_tool_call_output", "function_call_output"} and child_thread in json.dumps(payload.get("output", ""), default=str):
                    spawn_tool_id = payload.get("call_id", "")
                    break
        description = meta.get("description", "")
        if provider == "hermes" and not description:
            description = next((sanitize(row.get("payload", {}).get("message", ""), 200) for row in rows if row.get("type") == "event_msg" and row.get("payload", {}).get("type") == "user_message"), "")
        agent = {
            "id": agent_id,
            "name": meta.get("name") or agent_id,
            "agent_type": meta.get("agentType") or ("main" if agent_id == "main" else "subagent"),
            "description": description,
            "spawn_depth": int(meta.get("spawnDepth", 0 if agent_id == "main" else 1)),
            "spawn_tool_use_id": spawn_tool_id,
            "parent_agent_id": parent_id,
            "provider": provider,
            "source": str(path),
            "start_ts": timestamps[0].isoformat() if timestamps else None,
            "end_ts": timestamps[-1].isoformat() if timestamps else None,
        }
        agents.append(agent)
        if provider == "hermes":
            _parse_hermes_agent(rows, agent, events)
        else:
            _parse_transcript_agent(rows, agent, events)

    df = pd.DataFrame(events)
    if not df.empty:
        df["ts"] = pd.to_datetime(df["ts"], utc=True)
        df["end_ts"] = pd.to_datetime(df["end_ts"], utc=True)
        df = df.sort_values(["ts", "agent_id", "line_no"], na_position="last").reset_index(drop=True)
    df.to_parquet(out / "events.parquet", index=False)
    df.to_csv(out / "events.csv", index=False)
    (out / "agents.json").write_text(json.dumps({"provider": provider, "session_id": parsed_session_id, "main": str(main), "agents": agents}, indent=2))
    (out / ".session-data-dir").write_text(str(out.resolve()))
    state = Path.home() / ".cache" / "session-profiler" / "last-work-dir"
    state.parent.mkdir(parents=True, exist_ok=True)
    state.write_text(str(out.resolve()))
    return out


def _parse_transcript_agent(rows: list[dict], agent: dict, events: list[dict]) -> None:
    aid = agent["id"]
    base = {"provider": "transcript", "agent_id": aid, "agent_name": agent["name"], "agent_type": agent["agent_type"], "spawn_depth": agent["spawn_depth"]}
    tool_starts: dict[str, dict] = {}
    tool_uses_by_message: defaultdict[str, list[dict]] = defaultdict(list)
    messages: defaultdict[str, list[tuple[pd.Timestamp, dict]]] = defaultdict(list)

    for row in rows:
        ts = _ts(row.get("timestamp"))
        if pd.isna(ts):
            continue
        typ = row.get("type")
        msg = row.get("message", {})
        mid = msg.get("id", "")
        if typ == "assistant" and mid:
            messages[mid].append((ts, row))
        if typ == "user" and not row.get("toolUseResult"):
            texts = [b.get("text", "") for b in _content_blocks(row) if b.get("type") == "text"]
            if not texts and isinstance(msg.get("content"), str):
                texts = [msg["content"]]
            text = "\n".join(texts).strip()
            if text:
                events.append({**base, "ts": ts, "end_ts": ts, "duration_ms": 0.0, "event_type": "user_prompt", "message_id": "", "tool_use_id": "", "tool_name": "", "model": "", "text": sanitize(text), "input_preview": "", "output_preview": "", "is_error": False, "concurrent": False, "input_tokens": 0, "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0, "source": agent["source"], "line_no": row["_line_no"]})
        for block in _content_blocks(row):
            btype = block.get("type", "")
            common = {**base, "ts": ts, "end_ts": ts, "duration_ms": 0.0, "message_id": mid, "model": msg.get("model", ""), "source": agent["source"], "line_no": row["_line_no"], "input_tokens": 0, "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0, "is_error": False, "concurrent": False}
            if typ == "assistant" and btype in {"text", "thinking"}:
                events.append({**common, "event_type": "assistant_text" if btype == "text" else "thinking", "tool_use_id": "", "tool_name": "", "text": sanitize(block.get("text") or block.get("thinking")), "input_preview": "", "output_preview": ""})
            elif typ == "assistant" and btype == "tool_use":
                event = {**common, "event_type": "tool", "tool_use_id": block.get("id", ""), "tool_name": block.get("name", ""), "text": "", "input_preview": sanitize(block.get("input")), "output_preview": ""}
                events.append(event)
                tool_starts[event["tool_use_id"]] = event
                tool_uses_by_message[mid].append(event)
            elif typ == "user" and btype == "tool_result":
                tool_id = block.get("tool_use_id", "")
                error = bool(block.get("is_error") or row.get("toolUseResult", {}).get("isError"))
                output = block.get("content", row.get("toolUseResult", ""))
                events.append({**common, "event_type": "tool_result", "tool_use_id": tool_id, "tool_name": "", "text": "", "input_preview": "", "output_preview": sanitize(output), "is_error": error})
                if tool_id in tool_starts:
                    start = tool_starts[tool_id]
                    start["end_ts"] = ts
                    start["duration_ms"] = max(0.0, (ts - start["ts"]).total_seconds() * 1000)
                    start["output_preview"] = sanitize(output)
                    start["is_error"] = error

    for group in tool_uses_by_message.values():
        if len(group) > 1:
            for event in group:
                event["concurrent"] = True

    for mid, snapshots in messages.items():
        snapshots.sort(key=lambda pair: (pair[0], pair[1]["_line_no"]))
        first_ts, first_row = snapshots[0]
        last_ts, last_row = snapshots[-1]
        usage = last_row.get("message", {}).get("usage", {}) or {}
        events.append({**base, "ts": first_ts, "end_ts": last_ts, "duration_ms": max(0.0, (last_ts - first_ts).total_seconds() * 1000), "event_type": "inference", "message_id": mid, "tool_use_id": "", "tool_name": "", "model": last_row.get("message", {}).get("model", ""), "text": "", "input_preview": "", "output_preview": "", "is_error": False, "concurrent": False, "input_tokens": int(usage.get("input_tokens", 0) or 0), "cache_read_input_tokens": int(usage.get("cache_read_input_tokens", 0) or 0), "cache_creation_input_tokens": int(usage.get("cache_creation_input_tokens", 0) or 0), "output_tokens": int(usage.get("output_tokens", 0) or 0), "estimated_cost_usd": _cost(usage), "source": agent["source"], "line_no": first_row["_line_no"]})


def _hermes_is_error(value: Any) -> bool:
    if isinstance(value, str):
        try:
            return _hermes_is_error(json.loads(value))
        except json.JSONDecodeError:
            return bool(re.search(r"(?i)(?:process exited with code|exit code\s*[:=]?)\s*[1-9]\d*", value))
    if isinstance(value, list):
        return any(_hermes_is_error(item) for item in value)
    if not isinstance(value, dict):
        return False
    if value.get("is_error") or value.get("isError") or value.get("success") is False:
        return True
    if value.get("exit_code") not in (None, 0) or value.get("exitCode") not in (None, 0):
        return True
    if str(value.get("status", "")).lower() in {"error", "failed", "failure"}:
        return True
    return any(_hermes_is_error(item) for item in value.values() if isinstance(item, (dict, list)))


def _parse_hermes_agent(rows: list[dict], agent: dict, events: list[dict]) -> None:
    base = {"provider": "hermes", "agent_id": agent["id"], "agent_name": agent["name"], "agent_type": agent["agent_type"], "spawn_depth": agent["spawn_depth"]}
    models: dict[str, str] = {}
    for row in rows:
        if row.get("type") == "turn_context":
            payload = row.get("payload", {})
            models[payload.get("turn_id", "")] = payload.get("model", "")
    current_turn = ""
    inference_start: dict[str, pd.Timestamp] = {}
    tool_starts: dict[str, dict] = {}
    pending_tools: list[dict] = []
    response_index = 0

    def common(ts: pd.Timestamp, row: dict, turn_id: str) -> dict:
        return {**base, "ts": ts, "end_ts": ts, "duration_ms": 0.0, "message_id": turn_id, "model": models.get(turn_id, ""), "source": agent["source"], "line_no": row["_line_no"], "input_tokens": 0, "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0, "is_error": False, "concurrent": False}

    for row in rows:
        ts = _ts(row.get("timestamp"))
        if pd.isna(ts):
            continue
        payload = row.get("payload", {})
        row_type = row.get("type")
        payload_type = payload.get("type", "")
        metadata = payload.get("internal_chat_message_metadata_passthrough", {}) or {}
        turn_id = metadata.get("turn_id") or payload.get("turn_id") or current_turn
        if row_type == "event_msg" and payload_type == "task_started":
            current_turn = turn_id
            inference_start[turn_id] = ts
            continue
        if row_type == "turn_context":
            current_turn = payload.get("turn_id", current_turn)
            continue
        if row_type == "event_msg" and payload_type == "user_message":
            text = payload.get("message", "")
            if text:
                events.append({**common(ts, row, turn_id), "event_type": "user_prompt", "tool_use_id": "", "tool_name": "", "text": sanitize(text), "input_preview": "", "output_preview": ""})
            continue
        if row_type == "response_item" and payload_type == "message":
            if payload.get("role") != "assistant":
                continue
            text = "\n".join(block.get("text", "") for block in payload.get("content", []) if block.get("type") in {"output_text", "text"})
            if text:
                events.append({**common(ts, row, turn_id), "event_type": "assistant_text", "tool_use_id": "", "tool_name": "", "text": sanitize(text), "input_preview": "", "output_preview": ""})
            continue
        if row_type == "response_item" and payload_type == "reasoning":
            summary = payload.get("summary", [])
            text = "\n".join(item.get("text", "") if isinstance(item, dict) else str(item) for item in summary)
            events.append({**common(ts, row, turn_id), "event_type": "thinking", "tool_use_id": "", "tool_name": "", "text": sanitize(text), "input_preview": "", "output_preview": ""})
            continue
        if row_type == "response_item" and payload_type in {"custom_tool_call", "function_call", "local_shell_call", "web_search_call"}:
            tool_id = payload.get("call_id") or payload.get("id", "")
            tool_input = payload.get("input", payload.get("arguments", payload.get("action", "")))
            event = {**common(ts, row, turn_id), "event_type": "tool", "tool_use_id": tool_id, "tool_name": payload.get("name") or payload_type.removesuffix("_call"), "text": "", "input_preview": sanitize(tool_input), "output_preview": ""}
            events.append(event)
            tool_starts[tool_id] = event
            pending_tools.append(event)
            continue
        if row_type == "response_item" and payload_type in {"custom_tool_call_output", "function_call_output", "local_shell_call_output"}:
            tool_id = payload.get("call_id", "")
            output = payload.get("output", "")
            error = _hermes_is_error(output)
            events.append({**common(ts, row, turn_id), "event_type": "tool_result", "tool_use_id": tool_id, "tool_name": "", "text": "", "input_preview": "", "output_preview": sanitize(output), "is_error": error})
            if tool_id in tool_starts:
                start = tool_starts[tool_id]
                start["end_ts"] = ts
                start["duration_ms"] = max(0.0, (ts - start["ts"]).total_seconds() * 1000)
                start["output_preview"] = sanitize(output)
                start["is_error"] = error
            inference_start[turn_id] = ts
            continue
        if row_type == "event_msg" and payload_type == "token_count":
            if len(pending_tools) > 1:
                for event in pending_tools:
                    event["concurrent"] = True
            pending_tools = []
            usage = payload.get("info", {}).get("last_token_usage", {}) or {}
            if not usage or not turn_id or not any(int(usage.get(key, 0) or 0) for key in ("input_tokens", "cached_input_tokens", "output_tokens")):
                continue
            response_index += 1
            cached = int(usage.get("cached_input_tokens", 0) or 0)
            normalized = {"input_tokens": max(0, int(usage.get("input_tokens", 0) or 0) - cached), "cache_read_input_tokens": cached, "cache_creation_input_tokens": 0, "output_tokens": int(usage.get("output_tokens", 0) or 0)}
            start = inference_start.get(turn_id, ts)
            model = models.get(turn_id, "")
            events.append({**common(start, row, turn_id), "end_ts": ts, "duration_ms": max(0.0, (ts - start).total_seconds() * 1000), "event_type": "inference", "message_id": f"{turn_id}:{response_index}", "tool_use_id": "", "tool_name": "", "model": model, "text": "", "input_preview": "", "output_preview": "", **normalized, "estimated_cost_usd": _cost(normalized, "hermes", model)})
            inference_start[turn_id] = ts


def work_dir(value: str | Path | None = None) -> Path:
    if value:
        return Path(value).expanduser()
    if os.environ.get("SESSION_DATA_DIR"):
        return Path(os.environ["SESSION_DATA_DIR"]).expanduser()
    state = Path.home() / ".cache" / "session-profiler" / "last-work-dir"
    if state.exists():
        return Path(state.read_text().strip())
    raise FileNotFoundError("No parsed session. Run `sp parse <session>` first or set SESSION_DATA_DIR.")


def load(value: str | Path | None = None) -> pd.DataFrame:
    return pd.read_parquet(work_dir(value) / "events.parquet")


def load_agents(value: str | Path | None = None) -> dict:
    return json.loads((work_dir(value) / "agents.json").read_text())
