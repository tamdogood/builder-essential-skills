from __future__ import annotations

import json

import pandas as pd

from .dataset import load, work_dir


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


def _item_title(row) -> str:
    if row.event_type == "user_prompt":
        return "Prompt: " + (" ".join(str(row.text).split())[:80] or "user prompt")
    if row.event_type == "tool":
        prefix = "Failed tool" if bool(row.is_error) else "Tool"
        return f"{prefix}: {row.tool_name or 'tool'}"
    if row.event_type == "assistant_text":
        return "Response: " + (" ".join(str(row.text).split())[:80] or "assistant response")
    return str(row.event_type).replace("_", " ").title()


def _local_toc(data_dir) -> dict:
    df = load(data_dir)
    if df.empty:
        return {"phases": []}

    main_prompts = [
        {"ts": row.ts, "end_ts": row.end_ts, "text": row.text}
        for row in df[(df.agent_id == "main") & (df.event_type == "user_prompt")].sort_values("ts").itertuples()
    ]
    if not main_prompts:
        first = df.sort_values("ts").iloc[0]
        main_prompts = [{"ts": first.ts, "end_ts": first.end_ts, "text": ""}]
    phases = []
    session_end = df.end_ts.max()

    for index, prompt in enumerate(main_prompts):
        start = prompt["ts"]
        end = main_prompts[index + 1]["ts"] if index + 1 < len(main_prompts) else session_end
        part = df[(df.ts >= start) & (df.ts <= end) & df.event_type.isin(["assistant_text", "tool"])].sort_values("ts")
        prompt_text = " ".join(str(prompt["text"]).split())
        steps = []
        for row in part.head(20).itertuples():
            steps.append({
                "title": _item_title(row),
                "start_ts": row.ts.isoformat(),
                "end_ts": row.end_ts.isoformat(),
                "substeps": [],
            })
        phases.append({
            "title": f"Turn {index + 1}",
            "summary": prompt_text[:240] if prompt_text else "Session activity",
            "start_ts": pd.Timestamp(start).isoformat(),
            "end_ts": pd.Timestamp(end).isoformat(),
            "steps": steps,
        })
    return {"phases": phases}


def create(data_dir=None, dry_run=False) -> str:
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
    data = _local_toc(out)
    (out / "toc.json").write_text(json.dumps(data, indent=2))
    md = _markdown(data)
    (out / "toc.md").write_text(md)
    return md
