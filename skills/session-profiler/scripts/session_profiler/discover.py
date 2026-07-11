from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path


def claude_projects_root() -> Path:
    return Path.home() / ".claude" / "projects"


def codex_roots() -> list[Path]:
    root = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")).expanduser()
    return [root / "sessions", root / "archived_sessions"]


def project_dirs() -> list[Path]:
    root = claude_projects_root()
    paths = [p for p in root.iterdir() if p.is_dir()] if root.exists() else []
    paths.extend(p for p in codex_roots() if p.exists())
    return sorted(paths, key=lambda p: p.stat().st_mtime, reverse=True)


def detect_provider(path: Path) -> str:
    try:
        first = json.loads(path.open(errors="replace").readline())
        return "codex" if first.get("type") == "session_meta" else "claude"
    except (OSError, json.JSONDecodeError):
        return "claude"


def _session_meta(path: Path) -> dict:
    try:
        with path.open(errors="replace") as fh:
            first = json.loads(fh.readline())
        return first.get("payload", {}) if first.get("type") == "session_meta" else {}
    except (OSError, json.JSONDecodeError):
        return {}


def session_id(path: Path) -> str:
    return _session_meta(path).get("id") or path.stem


def codex_transcripts() -> list[Path]:
    paths = []
    for root in codex_roots():
        if root.exists():
            paths.extend(root.rglob("rollout-*.jsonl"))
    return sorted(paths, key=lambda p: p.stat().st_mtime, reverse=True)


def codex_index() -> dict[str, tuple[Path, dict]]:
    result = {}
    for path in codex_transcripts():
        meta = _session_meta(path)
        if meta.get("id"):
            result[meta["id"]] = (path, meta)
    return result


def codex_family(path: Path) -> list[tuple[str, Path, dict]]:
    """Return a Codex rollout and all recursively spawned subagent rollouts."""
    index = codex_index()
    root_id = session_id(path)
    children: dict[str, list[tuple[str, Path, dict]]] = {}
    for thread_id, (candidate, meta) in index.items():
        spawn = meta.get("source", {}).get("subagent", {}).get("thread_spawn", {}) if isinstance(meta.get("source"), dict) else {}
        parent = spawn.get("parent_thread_id")
        if parent:
            children.setdefault(parent, []).append((thread_id, candidate, meta))
    found: list[tuple[str, Path, dict]] = [(root_id, path, _session_meta(path))]
    queue = [root_id]
    while queue:
        parent = queue.pop(0)
        for item in children.get(parent, []):
            found.append(item)
            queue.append(item[0])
    return found


def main_transcripts(project_dir: Path) -> list[Path]:
    if not project_dir.exists():
        return []
    if project_dir in codex_roots() or ".codex/sessions" in str(project_dir) or ".codex/archived_sessions" in str(project_dir):
        paths = project_dir.rglob("rollout-*.jsonl")
        return sorted((p for p in paths if not _codex_parent_id(p)), key=lambda p: p.stat().st_mtime, reverse=True)
    return sorted((p for p in project_dir.glob("*.jsonl") if p.is_file()), key=lambda p: p.stat().st_mtime, reverse=True)


def _codex_parent_id(path: Path) -> str:
    source = _session_meta(path).get("source", {})
    if not isinstance(source, dict):
        return ""
    return source.get("subagent", {}).get("thread_spawn", {}).get("parent_thread_id", "")


def is_codex_subagent(path: Path) -> bool:
    return bool(_codex_parent_id(path))


def resolve_session(value: str | Path) -> Path:
    candidate = Path(value).expanduser()
    if candidate.is_file():
        return candidate.resolve()
    matches = find_sessions(str(value))
    if not matches:
        raise FileNotFoundError(f"No Claude Code or Codex session matches {value!r}")
    if len(matches) > 1:
        shown = "\n".join(f"  {session_id(p)}  {p}" for p in matches[:12])
        raise ValueError(f"Session prefix is ambiguous:\n{shown}")
    return matches[0]


def find_sessions(prefix: str) -> list[Path]:
    claude = [p for project in project_dirs() if ".claude/projects" in str(project) for p in main_transcripts(project) if p.stem.startswith(prefix)]
    codex = [p for p in codex_transcripts() if session_id(p).startswith(prefix) or p.stem.startswith(prefix)]
    return claude + codex


def _first_prompt(path: Path, limit: int = 100) -> str:
    provider = detect_provider(path)
    try:
        with path.open(errors="replace") as fh:
            for line in fh:
                row = json.loads(line)
                if provider == "codex":
                    payload = row.get("payload", {})
                    if row.get("type") != "event_msg" or payload.get("type") != "user_message":
                        continue
                    text = payload.get("message", "")
                else:
                    if row.get("type") != "user" or row.get("toolUseResult"):
                        continue
                    content = row.get("message", {}).get("content", "")
                    text = content if isinstance(content, str) else " ".join(x.get("text", "") for x in content if x.get("type") == "text")
                if text.strip():
                    return " ".join(text.split())[:limit]
    except (OSError, json.JSONDecodeError):
        pass
    return ""


def session_info(path: Path) -> dict:
    provider = detect_provider(path)
    agents = []
    if provider == "codex":
        root_id = session_id(path)
        for thread_id, transcript, meta in codex_family(path)[1:]:
            spawn = meta.get("source", {}).get("subagent", {}).get("thread_spawn", {})
            model, start, end = _transcript_shape(transcript)
            agents.append({"id": thread_id, "name": spawn.get("agent_nickname") or thread_id, "agentType": spawn.get("agent_role", "subagent"), "description": _first_prompt(transcript, 200), "spawnDepth": spawn.get("depth", 1), "parentThreadId": spawn.get("parent_thread_id", root_id), "model": model, "start_ts": start, "end_ts": end})
    else:
        side = path.parent / path.stem / "subagents"
        for meta_path in sorted(side.glob("agent-*.meta.json")) if side.exists() else []:
            try:
                meta = json.loads(meta_path.read_text())
            except (OSError, json.JSONDecodeError):
                meta = {}
            meta["id"] = meta_path.name.removesuffix(".meta.json")
            model, start, end = _transcript_shape(meta_path.with_suffix("").with_suffix(".jsonl"))
            meta.update({"model": model, "start_ts": start, "end_ts": end})
            agents.append(meta)
    model, start, end = _transcript_shape(path)
    span_seconds = None
    if start and end:
        span_seconds = (datetime.fromisoformat(end.replace("Z", "+00:00")) - datetime.fromisoformat(start.replace("Z", "+00:00"))).total_seconds()
    return {"provider": provider, "session_id": session_id(path), "path": str(path), "bytes": path.stat().st_size, "modified": path.stat().st_mtime, "model": model, "start_ts": start, "end_ts": end, "span_seconds": span_seconds, "first_prompt": _first_prompt(path), "subagents": agents}


def _transcript_shape(path: Path) -> tuple[str, str | None, str | None]:
    model = ""
    start = end = None
    if not path.exists():
        return model, start, end
    try:
        with path.open(errors="replace") as fh:
            for line in fh:
                row = json.loads(line)
                stamp = row.get("timestamp")
                if stamp:
                    start = start or stamp
                    end = stamp
                if not model:
                    model = row.get("message", {}).get("model", "")
                    if row.get("type") == "turn_context":
                        model = row.get("payload", {}).get("model", "")
    except (OSError, json.JSONDecodeError):
        pass
    return model, start, end
