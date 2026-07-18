from __future__ import annotations

from pathlib import Path

import pandas as pd

from .dataset import _price, load, load_agents, work_dir


def _duration(seconds: float) -> str:
    seconds = max(0.0, float(seconds or 0))
    if seconds < 60:
        return f"{seconds:.1f}s"
    minutes, sec = divmod(seconds, 60)
    if minutes < 60:
        return f"{int(minutes)}m {int(sec)}s"
    hours, minutes = divmod(minutes, 60)
    return f"{int(hours)}h {int(minutes)}m"


def _markdown_table(headers: list[str], rows: list[list[object]]) -> str:
    if not rows:
        return ""
    def cell(value: object) -> str:
        return str(value).replace("|", "\\|")

    lines = [
        "| " + " | ".join(cell(header) for header in headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(cell(value) for value in row) + " |")
    return "\n".join(lines)


def _fmt(df: pd.DataFrame) -> str:
    if df.empty:
        return "No matching events."
    return df.to_string(index=False, max_colwidth=80)


def agent_summary(data_dir: str | Path | None = None) -> str:
    df = load(data_dir)
    agents = load_agents(data_dir)["agents"]
    rows = []
    for agent in agents:
        part = df[df.agent_id == agent["id"]]
        inf = part[part.event_type == "inference"]
        tools = part[part.event_type == "tool"]
        start = pd.to_datetime(agent.get("start_ts"), utc=True)
        end = pd.to_datetime(agent.get("end_ts"), utc=True)
        priced = all(_price(row.provider, row.model) for row in inf.itertuples()) if not inf.empty else True
        rows.append({
            "agent": agent["name"], "id": agent["id"], "depth": agent["spawn_depth"],
            "wall_s": round((end - start).total_seconds(), 2) if not pd.isna(start) and not pd.isna(end) else 0,
            "inference_s": round(inf.duration_ms.sum() / 1000, 2), "tool_s": round(tools.duration_ms.sum() / 1000, 2),
            "tokens": int(inf[["input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens"]].sum().sum()),
            "est_cost_usd": round(inf.estimated_cost_usd.sum(), 4), "pricing": "reference" if priced else "partial/unavailable",
        })
    return "Estimated cost (public price table; not billing data)\n" + _fmt(pd.DataFrame(rows))


def costs(data_dir=None) -> str:
    df = load(data_dir)
    inf = df[df.event_type == "inference"]
    cols = ["input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens", "estimated_cost_usd"]
    result = inf.groupby(["provider", "agent_name", "model"], dropna=False)[cols].sum().reset_index()
    result["pricing"] = result.apply(lambda row: "reference" if _price(row.provider, row.model) else "unavailable", axis=1)
    result["estimated_cost_usd"] = result.estimated_cost_usd.round(5)
    return "ESTIMATES from public rates; not invoice/billing data.\n" + _fmt(result)


def slowest_tools(data_dir=None, n=20, agent=None) -> str:
    df = load(data_dir)
    part = df[df.event_type == "tool"]
    if agent:
        part = part[(part.agent_id == agent) | (part.agent_name == agent)]
    return _fmt(part.nlargest(n, "duration_ms")[["ts", "agent_name", "tool_name", "duration_ms", "is_error", "input_preview"]])


def tool_breakdown(data_dir=None, agent=None) -> str:
    df = load(data_dir)
    part = df[df.event_type == "tool"]
    if agent:
        part = part[(part.agent_id == agent) | (part.agent_name == agent)]
    out = part.groupby(["agent_name", "tool_name"]).agg(calls=("tool_name", "size"), errors=("is_error", "sum"), total_s=("duration_ms", lambda x: round(x.sum()/1000, 2)), mean_ms=("duration_ms", lambda x: round(x.mean(), 1)), max_ms=("duration_ms", lambda x: round(x.max(), 1))).reset_index()
    return _fmt(out.sort_values("total_s", ascending=False))


def inference_vs_tool(data_dir=None) -> str:
    df = load(data_dir)
    part = df[df.event_type.isin(["inference", "tool"])]
    out = part.groupby(["agent_name", "event_type"]).duration_ms.sum().unstack(fill_value=0) / 1000
    return _fmt(out.round(2).reset_index())


def errors(data_dir=None) -> str:
    df = load(data_dir)
    return _fmt(df[(df.event_type == "tool") & df.is_error][["ts", "agent_name", "tool_name", "duration_ms", "input_preview", "output_preview"]])


def turns(data_dir=None) -> str:
    df = load(data_dir)
    prompts = df[(df.agent_id == "main") & (df.event_type == "user_prompt")].sort_values("ts").copy()
    prompts["time_to_next_prompt_s"] = (prompts.ts.shift(-1) - prompts.ts).dt.total_seconds()
    prompts["prompt"] = prompts.text.str.replace(r"\s+", " ", regex=True).str[:160]
    return _fmt(prompts[["ts", "time_to_next_prompt_s", "prompt"]])


def brief(data_dir=None) -> str:
    out = work_dir(data_dir)
    df = load(out)
    metadata = load_agents(out)
    agents = metadata["agents"]
    inf = df[df.event_type == "inference"]
    tools = df[df.event_type == "tool"]
    prompts = df[(df.agent_id == "main") & (df.event_type == "user_prompt")]
    start, end = df.ts.min(), df.end_ts.max()
    wall_s = (end - start).total_seconds() if not df.empty else 0
    token_cols = ["input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens"]
    total_tokens = int(inf[token_cols].sum().sum()) if not inf.empty else 0
    total_cost = float(inf.estimated_cost_usd.sum()) if not inf.empty else 0.0
    lines = [
        "# Session profile",
        "",
        f"Provider: `{metadata.get('provider', 'unknown')}`",
        f"Session: `{metadata.get('session_id', 'unknown')}`",
        "",
        "## At a glance",
        "",
        _markdown_table(
            ["Wall", "Agents", "Prompts", "Tool calls", "Errors", "Tokens", "Est. cost"],
            [[_duration(wall_s), len(agents), len(prompts), len(tools), int(tools.is_error.sum()) if not tools.empty else 0, f"{total_tokens:,}", f"${total_cost:.4f}"]],
        ),
        "",
    ]

    highlights = []
    if not tools.empty:
        slow = tools.nlargest(1, "duration_ms").iloc[0]
        highlights.append(f"Longest tool call: `{slow.tool_name}` on `{slow.agent_name}` took {_duration(slow.duration_ms / 1000)}.")
    if not inf.empty:
        by_agent = inf.groupby("agent_name").estimated_cost_usd.sum().sort_values(ascending=False)
        if not by_agent.empty:
            highlights.append(f"Highest estimated cost: `{by_agent.index[0]}` at ${by_agent.iloc[0]:.4f}.")
    if not tools.empty and tools.is_error.any():
        failed = tools[tools.is_error].groupby("tool_name").size().sort_values(ascending=False)
        highlights.append(f"Tool failures: {int(tools.is_error.sum())}, led by `{failed.index[0]}`.")
    if not highlights:
        highlights.append("No failed tool calls were recorded.")
    lines.extend(["## What stands out", "", *[f"- {item}" for item in highlights], ""])

    toc_path = out / "toc.json"
    if toc_path.exists():
        import json

        toc = json.loads(toc_path.read_text())
        rows = []
        for phase in toc.get("phases", []):
            try:
                phase_start = pd.to_datetime(phase["start_ts"], utc=True)
                phase_end = pd.to_datetime(phase["end_ts"], utc=True)
            except (KeyError, ValueError):
                continue
            rows.append([
                phase.get("title", "Phase"),
                _duration((phase_end - phase_start).total_seconds()),
                phase.get("summary", ""),
            ])
        if rows:
            lines.extend(["## Storyline", "", _markdown_table(["Phase", "Duration", "Summary"], rows), ""])
    elif not prompts.empty:
        prompt_rows = []
        for _, row in prompts.sort_values("ts").head(6).iterrows():
            prompt_rows.append([row.ts.isoformat(), " ".join(str(row.text).split())[:120]])
        lines.extend(["## Prompt trail", "", _markdown_table(["Time", "Prompt"], prompt_rows), ""])

    score_rows = []
    for agent in agents:
        part = df[df.agent_id == agent["id"]]
        agent_inf = part[part.event_type == "inference"]
        agent_tools = part[part.event_type == "tool"]
        start = pd.to_datetime(agent.get("start_ts"), utc=True)
        end = pd.to_datetime(agent.get("end_ts"), utc=True)
        agent_wall_s = (end - start).total_seconds() if not pd.isna(start) and not pd.isna(end) else 0
        score_rows.append([
            agent["name"],
            agent["agent_type"],
            _duration(agent_wall_s),
            _duration(agent_inf.duration_ms.sum() / 1000),
            _duration(agent_tools.duration_ms.sum() / 1000),
            f"{int(agent_inf[token_cols].sum().sum()):,}" if not agent_inf.empty else "0",
            f"${agent_inf.estimated_cost_usd.sum():.4f}" if not agent_inf.empty else "$0.0000",
        ])
    lines.extend(["## Agent scoreboard", "", _markdown_table(["Agent", "Role", "Wall", "Inference", "Tools", "Tokens", "Est. cost"], score_rows), ""])
    lines.append("Costs are estimates from public reference rates, not billing data.")
    result = "\n".join(lines) + "\n"
    (out / "brief.md").write_text(result)
    return result


def timeline(moment, window=120, data_dir=None) -> str:
    df = load(data_dir)
    center = pd.to_datetime(moment, utc=True)
    start, end = center - pd.Timedelta(seconds=window), center + pd.Timedelta(seconds=window)
    part = df[(df.ts <= end) & (df.end_ts >= start) & df.event_type.isin(["user_prompt", "inference", "tool"])]
    return _fmt(part[["ts", "end_ts", "agent_name", "event_type", "tool_name", "duration_ms", "is_error", "input_preview"]])


def events_query(data_dir=None, agent=None, tool=None, grep=None, since=None, n=30, long=False) -> str:
    df = load(data_dir)
    if agent:
        df = df[(df.agent_id == agent) | (df.agent_name == agent)]
    if tool:
        df = df[df.tool_name == tool]
    if since:
        df = df[df.ts >= pd.to_datetime(since, utc=True)]
    if grep:
        searchable = df[["text", "input_preview", "output_preview", "tool_name"]].fillna("").agg(" ".join, axis=1)
        df = df[searchable.str.contains(grep, case=False, regex=False)]
    cols = ["ts", "agent_name", "event_type", "tool_name", "duration_ms", "is_error", "text", "input_preview", "output_preview"] if long else ["ts", "agent_name", "event_type", "tool_name", "duration_ms", "is_error", "text"]
    return _fmt(df.head(n)[cols])


def review(data_dir=None) -> str:
    df = load(data_dir)
    tools = df[df.event_type == "tool"]
    inf = df[df.event_type == "inference"]
    total_s = (tools.duration_ms.sum() + inf.duration_ms.sum()) / 1000
    lines = ["# Session improvement review", "", "Use these observations to adjust the next agent run:", ""]
    if tools.is_error.any():
        lines.append(f"- Investigate {int(tools.is_error.sum())} failed tool calls; repeated failures usually indicate missing preflight checks.")
    if not tools.empty:
        slow = tools.nlargest(3, "duration_ms")
        for _, row in slow.iterrows():
            lines.append(f"- Slow path: {row.tool_name} on {row.agent_name} took {row.duration_ms/1000:.1f}s. Consider batching, narrowing, or running independent work concurrently.")
    tool_share = tools.duration_ms.sum() / (tools.duration_ms.sum() + inf.duration_ms.sum()) if total_s else 0
    lines.append(f"- Observed summed active time was {total_s:.1f}s ({tool_share:.0%} tools, {1-tool_share:.0%} inference). Overlapping spans make this larger than wall time.")
    lines.append(f"- Estimated cost was ${inf.estimated_cost_usd.sum():.4f}; this uses provider-specific public API reference rates, not subscription or billing data.")
    if len(load_agents(data_dir)["agents"]) == 1:
        lines.append("- No subagents were recorded. For separable research or verification work, delegation may reduce wall time.")
    else:
        lines.append("- Compare subagent outputs and runtimes before reusing the same delegation shape; keep assignments bounded and independently verifiable.")
    result = "\n".join(lines) + "\n"
    (work_dir(data_dir) / "review.md").write_text(result)
    return result
