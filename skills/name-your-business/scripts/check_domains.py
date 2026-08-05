#!/usr/bin/env python3
"""Query authoritative RDAP services for domain registration signals.

This helper deliberately reports ``no_record`` instead of ``available``. A live
registrar must still explicitly offer the exact domain before an agent may call
it verified available at check time.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse, urlsplit
from urllib.request import Request, urlopen


IANA_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json"
USER_AGENT = "builder-essential-skills/name-your-business"
LABEL_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


def normalize_domain(value: str) -> str:
    raw = value.strip()
    if not raw:
        raise ValueError("empty domain")

    parsed = urlsplit(raw if "://" in raw else f"//{raw}")
    host = parsed.hostname
    if not host:
        raise ValueError("could not find a hostname")

    host = host.rstrip(".").lower()
    try:
        ascii_domain = host.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValueError(f"invalid internationalized domain: {exc}") from exc

    if len(ascii_domain) > 253 or "." not in ascii_domain:
        raise ValueError("use a fully qualified domain such as example.com")

    labels = ascii_domain.split(".")
    if any(not LABEL_RE.fullmatch(label) for label in labels):
        raise ValueError("domain contains an invalid label")
    return ascii_domain


def fetch_json(source: str, timeout: float) -> dict[str, Any]:
    parsed = urlparse(source)
    if parsed.scheme in {"http", "https"}:
        request = Request(
            source,
            headers={
                "Accept": "application/rdap+json, application/json",
                "User-Agent": USER_AGENT,
            },
        )
        with urlopen(request, timeout=timeout) as response:
            return json.load(response)
    with Path(source).expanduser().open(encoding="utf-8") as handle:
        return json.load(handle)


def rdap_services(bootstrap: dict[str, Any]) -> dict[str, list[str]]:
    mapping: dict[str, list[str]] = {}
    for service in bootstrap.get("services", []):
        if not isinstance(service, list) or len(service) != 2:
            continue
        tlds, urls = service
        if not isinstance(tlds, list) or not isinstance(urls, list):
            continue
        clean_urls = [url for url in urls if isinstance(url, str) and url.startswith(("http://", "https://"))]
        for tld in tlds:
            if isinstance(tld, str):
                mapping[tld.lower()] = clean_urls
    return mapping


def event_date(payload: dict[str, Any], action: str) -> str | None:
    for event in payload.get("events", []):
        if isinstance(event, dict) and event.get("eventAction") == action:
            value = event.get("eventDate")
            if isinstance(value, str):
                return value
    return None


def base_result(domain: str, checked_at: str) -> dict[str, Any]:
    return {
        "domain": domain,
        "registry_status": "unknown",
        "checked_at": checked_at,
        "rdap_url": None,
        "registration_date": None,
        "expiration_date": None,
        "note": "",
    }


def query_domain(domain: str, bases: list[str], timeout: float, checked_at: str) -> dict[str, Any]:
    result = base_result(domain, checked_at)
    if not bases:
        result["note"] = f"IANA bootstrap lists no RDAP service for .{domain.rsplit('.', 1)[-1]}"
        return result

    failures: list[str] = []
    for base in bases:
        rdap_url = f"{base.rstrip('/')}/domain/{quote(domain, safe='')}"
        result["rdap_url"] = rdap_url
        try:
            request = Request(
                rdap_url,
                headers={
                    "Accept": "application/rdap+json, application/json",
                    "User-Agent": USER_AGENT,
                },
            )
            with urlopen(request, timeout=timeout) as response:
                payload = json.load(response)
            if not isinstance(payload, dict) or (
                payload.get("objectClassName") != "domain"
                and not payload.get("ldhName")
                and not payload.get("unicodeName")
            ):
                failures.append(f"{rdap_url}: HTTP 200 without an RDAP domain object")
                continue
            result["registry_status"] = "registered"
            result["registration_date"] = event_date(payload, "registration")
            result["expiration_date"] = event_date(payload, "expiration")
            statuses = payload.get("status", [])
            status_text = ", ".join(value for value in statuses if isinstance(value, str))
            result["note"] = status_text or "authoritative RDAP returned a domain record"
            return result
        except HTTPError as exc:
            if exc.code in {404, 410}:
                result["registry_status"] = "no_record"
                result["note"] = f"authoritative RDAP returned HTTP {exc.code}; confirm with a live registrar"
                return result
            failures.append(f"{rdap_url}: HTTP {exc.code}")
        except (URLError, TimeoutError, json.JSONDecodeError, OSError, ValueError) as exc:
            failures.append(f"{rdap_url}: {exc}")

    result["note"] = "; ".join(failures) or "RDAP query failed"
    return result


def escape_markdown(value: Any) -> str:
    return str(value if value is not None else "—").replace("|", "\\|").replace("\n", " ")


def render_markdown(results: list[dict[str, Any]]) -> str:
    lines = [
        "| Domain | Registry signal | Checked (UTC) | Evidence | Note |",
        "| --- | --- | --- | --- | --- |",
    ]
    for result in results:
        evidence = result["rdap_url"] or "—"
        lines.append(
            "| "
            + " | ".join(
                escape_markdown(value)
                for value in (
                    result["domain"],
                    result["registry_status"],
                    result["checked_at"],
                    evidence,
                    result["note"],
                )
            )
            + " |"
        )
    lines.append("")
    lines.append("`no_record` is a registry signal, not proof of registrar availability or a reservation.")
    return "\n".join(lines)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check authoritative RDAP registration signals without claiming domain availability.",
    )
    parser.add_argument("domains", nargs="+", help="fully qualified domains to check")
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    parser.add_argument("--timeout", type=float, default=8.0, help="per-request timeout in seconds")
    parser.add_argument("--bootstrap", default=IANA_BOOTSTRAP_URL, help="IANA RDAP bootstrap URL or local JSON file")
    parser.add_argument("--rdap-base", help="override the authoritative RDAP base URL (primarily for a known registry or tests)")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    checked_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    results: list[dict[str, Any]] = []
    normalized: list[str] = []

    for supplied in args.domains:
        try:
            normalized.append(normalize_domain(supplied))
        except ValueError as exc:
            result = base_result(supplied, checked_at)
            result["registry_status"] = "invalid"
            result["note"] = str(exc)
            results.append(result)

    service_map: dict[str, list[str]] = {}
    if normalized and not args.rdap_base:
        try:
            service_map = rdap_services(fetch_json(args.bootstrap, args.timeout))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            for domain in normalized:
                result = base_result(domain, checked_at)
                result["note"] = f"could not load RDAP bootstrap: {exc}"
                results.append(result)
            normalized = []

    for domain in normalized:
        tld = domain.rsplit(".", 1)[-1]
        bases = [args.rdap_base] if args.rdap_base else service_map.get(tld, [])
        results.append(query_domain(domain, bases, args.timeout, checked_at))

    if args.format == "json":
        print(json.dumps(results, indent=2, sort_keys=True))
    else:
        print(render_markdown(results))

    return 1 if any(result["registry_status"] in {"unknown", "invalid"} for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
