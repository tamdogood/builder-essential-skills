#!/usr/bin/env python3
"""Resolve techlead-loop model routing and print the effective plan.

The Lead runs a strong leading model; cheaper submodels do the typing. Every
role — lead, builder, reviewer, researcher, scout, critic — is an independently
configurable slot, and the "submodel" of each role is its reasoning effort. This
resolver reads the provider registry (models.json) and the role config, then
prints exactly which model + effort each role will use, where that decision came
from, and the concrete command that dispatch would run.

    lead-config.py                 # table of the resolved routing
    lead-config.py --json          # machine-readable
    lead-config.py --role lead     # one role, verbose
    lead-config.py --check         # verify each provider CLI is on PATH
    lead-config.py --repo-root DIR # resolve against another repo

Config grammar (`.lead/config` in the repo, then `~/.lead/config`):

    lead       = claude/fable:xhigh   # the leading model, at max reasoning
    researcher = codex/best:high
    builder    = codex/best:xhigh
    reviewer   = inherit-lead         # fresh judge at the lead's capability
    scout      = codex/best:low
    critic     = claude/fable:high

    alias fast = claude/haiku:low     # define once, reuse anywhere
    when trivial mechanical edit  -> claude/haiku:low   # cheap exact patch
    when broad ambiguous refactor -> codex/best:xhigh   # deeper search budget

A role value is `<provider>/<model>[:<effort>]`, an alias name, or the sentinel
`inherit-lead`. Stdlib only; runs on any Python 3.9+.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path

ROLES = ["lead", "builder", "reviewer", "researcher", "scout", "critic"]

# Built-in defaults — used when no config file sets a role. The lead defaults to
# Fable because the whole design leans on a strong leading model; the reviewer
# inherits the lead's tier so nobody grades their own work at a weaker one.
DEFAULT_ROLES: dict[str, str] = {
    "lead": "claude/fable:xhigh",
    "reviewer": "inherit-lead",
    "researcher": "codex/best:high",
    "builder": "codex/best:xhigh",
    "scout": "codex/best:low",
    "critic": "claude/fable:high",
}

# Fallback registry, used only if models.json cannot be found or parsed. The
# committed models.json next to this file is the real source of truth.
FALLBACK_REGISTRY: dict[str, dict] = {
    "providers": {
        "claude": {
            "cli": "claude",
            "kind": "claude",
            "default_model": "fable",
            "default_effort": "xhigh",
            "efforts": ["low", "medium", "high", "xhigh", "max"],
            "models": {
                "fable": "claude-fable-5",
                "opus": "claude-opus-4-8",
                "sonnet": "claude-sonnet-5",
                "haiku": "claude-haiku-4-5",
            },
            "tier_down": {"fable": "sonnet", "opus": "sonnet", "sonnet": "haiku"},
        },
        "codex": {
            "cli": "codex",
            "kind": "codex",
            "default_model": "best",
            "default_effort": "xhigh",
            "efforts": ["low", "medium", "high", "xhigh"],
            "models": {"best": "gpt-5.5"},
            "tier_down": {},
        },
    }
}

# When a codex-first role has no working Codex CLI, dispatch falls back to this.
CODEX_ABSENT_FALLBACK = "claude/sonnet:high"

SPEC_RE = re.compile(r"^(?P<provider>[a-zA-Z0-9_-]+)/(?P<model>[a-zA-Z0-9_.\-]+)(?::(?P<effort>[a-zA-Z0-9_-]+))?$")


class ConfigError(Exception):
    pass


def _merge_registry(base: dict, extra: dict) -> dict:
    out = json.loads(json.dumps(base))
    for name, prov in extra.get("providers", {}).items():
        if name == "//":
            continue
        out.setdefault("providers", {})[name] = prov
    return out


def load_registry(repo_root: Path) -> dict:
    """Built-in fallback <- shipped models.json <- ~/.lead <- repo .lead."""
    registry = json.loads(json.dumps(FALLBACK_REGISTRY))
    sources = [
        Path(__file__).resolve().parent / "models.json",
        Path.home() / ".lead" / "models.json",
        repo_root / ".lead" / "models.json",
    ]
    for src in sources:
        if not src.is_file():
            continue
        try:
            data = json.loads(src.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise ConfigError(f"{src}: {exc}") from exc
        registry = _merge_registry(registry, data)
    # Drop the documentation key if it rode along.
    registry.get("providers", {}).pop("//", None)
    return registry


def _config_files(repo_root: Path) -> list[Path]:
    # User config first (lower priority), repo config last (wins).
    return [Path.home() / ".lead" / "config", repo_root / ".lead" / "config"]


def load_config(repo_root: Path) -> tuple[dict[str, tuple[str, str]], dict[str, str], list[dict]]:
    """Return (roles, aliases, rules).

    roles maps role -> (spec, source-label); aliases maps name -> spec; rules is
    an ordered list of {"match", "spec", "why", "source"} dispatch rules.
    """
    roles: dict[str, tuple[str, str]] = {r: (v, "built-in default") for r, v in DEFAULT_ROLES.items()}
    aliases: dict[str, str] = {}
    rules: list[dict] = []

    for path in _config_files(repo_root):
        if not path.is_file():
            continue
        label = _short(path)
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("alias "):
                body = line[len("alias "):]
                if "=" not in body:
                    raise ConfigError(f"{label}: malformed alias line: {raw}")
                name, spec = body.split("=", 1)
                aliases[name.strip()] = _strip_comment(spec)
                continue
            if line.startswith("when ") and "->" in line:
                match, rest = line[len("when "):].split("->", 1)
                spec, why = _split_why(rest)
                rules.append({"match": match.strip(), "spec": spec, "why": why, "source": label})
                continue
            if "=" in line:
                key, spec = line.split("=", 1)
                key = key.strip()
                if key in ROLES:
                    roles[key] = (_strip_comment(spec), label)
                else:
                    print(f"warning: {label}: unknown role key {key!r} (ignored)", file=sys.stderr)
                continue
            print(f"warning: {label}: unparsed line: {raw}", file=sys.stderr)
    return roles, aliases, rules


def _short(path: Path) -> str:
    try:
        home = Path.home()
        if path == home / ".lead" / "config":
            return "~/.lead/config"
    except Exception:
        pass
    return ".lead/config"


def _strip_comment(value: str) -> str:
    return value.split("#", 1)[0].strip()


def _split_why(rest: str) -> tuple[str, str]:
    if "#" in rest:
        spec, why = rest.split("#", 1)
        return spec.strip(), why.strip()
    return rest.strip(), ""


def resolve_spec(spec: str, aliases: dict[str, str], registry: dict, lead_spec: str | None) -> dict:
    """Turn a spec string into a concrete routing dict."""
    seen: set[str] = set()
    while spec in aliases:
        if spec in seen:
            raise ConfigError(f"alias cycle at {spec!r}")
        seen.add(spec)
        spec = aliases[spec]
    if spec in ("inherit-lead", "inherit"):
        if lead_spec is None:
            raise ConfigError("inherit-lead used for the lead role itself")
        return resolve_spec(lead_spec, aliases, registry, None)

    m = SPEC_RE.match(spec)
    if not m:
        raise ConfigError(f"bad spec {spec!r} (want provider/model[:effort])")
    provider = m.group("provider")
    model = m.group("model")
    effort = m.group("effort")

    prov = registry.get("providers", {}).get(provider)
    warnings: list[str] = []
    if prov is None:
        raise ConfigError(f"unknown provider {provider!r} — add it to models.json")

    model_id = prov.get("models", {}).get(model)
    if model_id is None:
        # Allow a raw model id to pass through, but flag it.
        model_id = model
        warnings.append(f"model alias {model!r} not in registry for {provider!r}; using it verbatim")
    if effort is None:
        effort = prov.get("default_effort", "high")
    elif effort not in prov.get("efforts", []):
        warnings.append(f"effort {effort!r} not in {provider!r} efforts {prov.get('efforts', [])}")

    return {
        "spec": spec,
        "provider": provider,
        "kind": prov.get("kind", provider),
        "cli": prov.get("cli", provider),
        "model": model,
        "model_id": model_id,
        "effort": effort,
        "command": _command(prov, model_id, effort),
        "warnings": warnings,
    }


def _command(prov: dict, model_id: str, effort: str) -> str:
    kind = prov.get("kind")
    cli = prov.get("cli", kind)
    if kind == "codex":
        return f'{cli} exec -m {model_id} -c model_reasoning_effort="{effort}"'
    if kind == "claude":
        return f"{cli} -p --model {model_id} --effort {effort}"
    return f"{cli} --model {model_id} --effort {effort}"


def resolve(repo_root: Path) -> dict:
    registry = load_registry(repo_root)
    roles, aliases, rules = load_config(repo_root)

    lead_spec = roles["lead"][0]
    resolved_roles: dict[str, dict] = {}
    for role in ROLES:
        spec, source = roles[role]
        info = resolve_spec(spec, aliases, registry, lead_spec if role != "lead" else None)
        info["role"] = role
        info["source"] = source
        resolved_roles[role] = info

    resolved_rules = []
    for rule in rules:
        info = resolve_spec(rule["spec"], aliases, registry, lead_spec)
        info.update({"match": rule["match"], "why": rule["why"], "source": rule["source"]})
        resolved_rules.append(info)

    return {"roles": resolved_roles, "rules": resolved_rules, "registry": registry, "aliases": aliases}


def _cli_available(cli: str) -> bool:
    return shutil.which(cli) is not None


def print_table(result: dict, check: bool) -> None:
    roles = result["roles"]
    width = max(len(r) for r in ROLES)
    print("techlead-loop model routing")
    print("=" * 60)
    for role in ROLES:
        info = roles[role]
        line = f"{role.ljust(width)}  {info['provider']}/{info['model']}:{info['effort']}"
        line += f"  ->  {info['model_id']}"
        print(line)
        detail = f"{' ' * width}  from {info['source']}"
        if check:
            ok = _cli_available(info["cli"])
            mark = "ok" if ok else "MISSING"
            detail += f" | cli `{info['cli']}` {mark}"
            if not ok and info["kind"] == "codex":
                detail += f" -> would fall back to {CODEX_ABSENT_FALLBACK}"
        print(detail)
        for w in info.get("warnings", []):
            print(f"{' ' * width}  ! {w}")
    if result["rules"]:
        print("-" * 60)
        print("dispatch rules (task-class overrides):")
        for r in result["rules"]:
            why = f"  # {r['why']}" if r["why"] else ""
            print(f"  when {r['match']} -> {r['provider']}/{r['model']}:{r['effort']}{why}")
    print("-" * 60)
    print(f"lead command:    {roles['lead']['command']}")
    print(f"builder command: {roles['builder']['command']}")


def print_role(result: dict, role: str) -> int:
    if role not in result["roles"]:
        print(f"unknown role {role!r}; choose from {', '.join(ROLES)}", file=sys.stderr)
        return 2
    info = result["roles"][role]
    for key in ("role", "provider", "model", "model_id", "effort", "cli", "source", "command"):
        print(f"{key}: {info[key]}")
    for w in info.get("warnings", []):
        print(f"warning: {w}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Resolve techlead-loop model routing.")
    parser.add_argument("--repo-root", default=".", help="repository root to resolve against")
    parser.add_argument("--role", help="print one role in detail")
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    parser.add_argument("--check", action="store_true", help="verify each provider CLI is on PATH")
    args = parser.parse_args(argv)

    repo_root = Path(args.repo_root).resolve()
    try:
        result = resolve(repo_root)
    except ConfigError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.json:
        payload = {
            "roles": {r: {k: v for k, v in info.items() if k != "warnings" or v}
                      for r, info in result["roles"].items()},
            "rules": result["rules"],
            "aliases": result["aliases"],
        }
        if args.check:
            for info in payload["roles"].values():
                info["cli_available"] = _cli_available(info["cli"])
        print(json.dumps(payload, indent=2))
        return 0

    if args.role:
        return print_role(result, args.role)

    print_table(result, args.check)
    return 0


if __name__ == "__main__":
    sys.exit(main())
