from __future__ import annotations

from pathlib import Path

import pandas as pd

from .dataset import _price, load, load_agents, work_dir


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
