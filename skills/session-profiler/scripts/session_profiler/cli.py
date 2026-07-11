from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

from . import analyses
from .dataset import parse, work_dir
from .discover import codex_transcripts, find_sessions, is_codex_subagent, main_transcripts, project_dirs, resolve_session, session_info
from .toc import create as create_toc
from .trace import create as create_trace, open_ui


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="sp", description="Profile Claude Code and Codex JSONL sessions")
    p.add_argument("--data-dir", help="Parsed work directory (also SESSION_DATA_DIR)")
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("projects")
    x = sub.add_parser("list"); x.add_argument("--project-dir", type=Path); x.add_argument("--provider", choices=["claude", "codex"]); x.add_argument("--n", type=int, default=20)
    x = sub.add_parser("find"); x.add_argument("prefix")
    x = sub.add_parser("info"); x.add_argument("session")
    x = sub.add_parser("parse"); x.add_argument("session"); x.add_argument("--out", type=Path)
    sub.add_parser("agent-summary"); sub.add_parser("costs")
    x = sub.add_parser("slowest-tools"); x.add_argument("--n", type=int, default=20); x.add_argument("--agent")
    x = sub.add_parser("tool-breakdown"); x.add_argument("--agent")
    sub.add_parser("inference-vs-tool"); sub.add_parser("errors"); sub.add_parser("turns"); sub.add_parser("review")
    x = sub.add_parser("timeline"); x.add_argument("moment"); x.add_argument("--window", type=int, default=120)
    x = sub.add_parser("events"); x.add_argument("--agent"); x.add_argument("--tool"); x.add_argument("--grep"); x.add_argument("--since"); x.add_argument("--n", type=int, default=30); x.add_argument("--long", action="store_true")
    x = sub.add_parser("toc"); x.add_argument("--dry-run", action="store_true"); x.add_argument("--engine", choices=["auto", "claude", "codex"], default="auto"); x.add_argument("--model")
    sub.add_parser("trace"); sub.add_parser("open"); sub.add_parser("where")
    return p


def main() -> None:
    args = parser().parse_args(); data = args.data_dir
    if args.command == "projects":
        for path in project_dirs(): print(datetime.fromtimestamp(path.stat().st_mtime).isoformat(timespec="seconds"), path)
    elif args.command == "list":
        if args.project_dir:
            paths = main_transcripts(args.project_dir.expanduser())
        else:
            paths = []
            if args.provider != "codex":
                for d in project_dirs():
                    if ".claude/projects" in str(d): paths.extend(main_transcripts(d))
            if args.provider != "claude": paths.extend(p for p in codex_transcripts() if not is_codex_subagent(p))
            paths = sorted(paths, key=lambda path: path.stat().st_mtime, reverse=True)
        shown = 0
        for path in paths:
            info = session_info(path)
            span = f"{info['span_seconds']:.0f}s" if info["span_seconds"] is not None else "?s"; print(f"{info['provider']:<6} {info['session_id']}  {info['bytes']/1024:.1f} KiB  {len(info['subagents'])} subagents  {span}  {info['first_prompt']}")
            shown += 1
            if shown >= args.n: break
    elif args.command == "find":
        for path in find_sessions(args.prefix): print(path)
    elif args.command == "info": print(json.dumps(session_info(resolve_session(args.session)), indent=2))
    elif args.command == "parse": print(parse(args.session, args.out))
    elif args.command == "agent-summary": print(analyses.agent_summary(data))
    elif args.command == "costs": print(analyses.costs(data))
    elif args.command == "slowest-tools": print(analyses.slowest_tools(data, args.n, args.agent))
    elif args.command == "tool-breakdown": print(analyses.tool_breakdown(data, args.agent))
    elif args.command == "inference-vs-tool": print(analyses.inference_vs_tool(data))
    elif args.command == "errors": print(analyses.errors(data))
    elif args.command == "turns": print(analyses.turns(data))
    elif args.command == "timeline": print(analyses.timeline(args.moment, args.window, data))
    elif args.command == "events": print(analyses.events_query(data, args.agent, args.tool, args.grep, args.since, args.n, args.long))
    elif args.command == "review": print(analyses.review(data))
    elif args.command == "toc": print(create_toc(data, args.dry_run, args.model, args.engine))
    elif args.command == "trace": print(create_trace(data))
    elif args.command == "open": print(open_ui())
    elif args.command == "where": print(work_dir(data))


if __name__ == "__main__":
    main()
