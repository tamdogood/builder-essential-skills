from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from .dataset import load, load_agents, work_dir


def digest(data_dir=None) -> str:
    df = load(data_dir)
    part = df[(df.agent_id == "main") & df.event_type.isin(["user_prompt", "assistant_text", "tool"])]
    lines = []
    for _, row in part.sort_values("ts").iterrows():
        if row.event_type == "tool" and row.tool_name not in {"Agent", "Task"} and "spawn_agent" not in str(row.tool_name):
            continue
        body = row.text if row.event_type != "tool" else f"spawn {row.tool_name}: {row.input_preview}"
        body = " ".join(str(body).split())[:1000]
        if body:
            lines.append(f"[{row.ts.isoformat()}] {row.event_type}: {body}")
    return "\n".join(lines)


def _markdown(data: dict) -> str:
    lines = ["# Session table of contents", ""]
    for phase in data.get("phases", []):
        lines.append(f"## {phase.get('title', 'Phase')}")
        if phase.get("summary"):
            lines.append(phase["summary"])
        lines.append("")
        for step in phase.get("steps", []):
            lines.append(f"- {step.get('title', 'Step')}")
            for sub in step.get("substeps", []):
                lines.append(f"  - {sub}")
        lines.append("")
    return "\n".join(lines)


def create(data_dir=None, dry_run=False, model=None, engine="auto") -> str:
    out = work_dir(data_dir)
    source = digest(out)
    prompt = """Write a chronological, hierarchical table of contents for this agent coding session.
Choose the number of phases from the work itself. Each phase needs title, summary, start_ts,
end_ts, and steps. Each step needs title, start_ts, end_ts, and optional substeps (strings).
Use concrete actions, not generic labels. Return JSON only: {\"phases\":[...]}.

SESSION DIGEST
""" + source
    (out / "toc-prompt.txt").write_text(prompt)
    if dry_run:
        return prompt
    provider = load_agents(out).get("provider", "claude")
    selected = provider if engine == "auto" else engine
    if selected == "codex":
        result_file = out / "toc-response.txt"
        command = ["codex", "exec", "--ephemeral", "--sandbox", "read-only", "--skip-git-repo-check", "--color", "never", "-o", str(result_file)]
        if model:
            command.extend(["--model", model])
        command.append(prompt)
        proc = subprocess.run(command, text=True, capture_output=True)
        raw = result_file.read_text().strip() if result_file.exists() else proc.stdout.strip()
    else:
        command = ["claude", "-p", "--model", model or "sonnet", prompt]
        proc = subprocess.run(command, text=True, capture_output=True)
        raw = proc.stdout.strip()
    if proc.returncode:
        raise RuntimeError(proc.stderr.strip() or f"{selected} TOC generation failed")
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
    data = json.loads(raw)
    (out / "toc.json").write_text(json.dumps(data, indent=2))
    md = _markdown(data)
    (out / "toc.md").write_text(md)
    return md
