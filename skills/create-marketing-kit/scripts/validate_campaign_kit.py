#!/usr/bin/env python3
"""Validate dimensions and file budgets declared by a campaign manifest."""

from __future__ import annotations

import argparse
import json
import struct
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as stream:
        header = stream.read(24)
    if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("invalid PNG header")
    return struct.unpack(">II", header[16:24])


def webp_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as stream:
        header = stream.read(30)
    if len(header) < 16 or header[:4] != b"RIFF" or header[8:12] != b"WEBP":
        raise ValueError("invalid WebP header")
    chunk = header[12:16]
    if chunk == b"VP8X" and len(header) >= 30:
        return (
            1 + int.from_bytes(header[24:27], "little"),
            1 + int.from_bytes(header[27:30], "little"),
        )
    if chunk == b"VP8 " and len(header) >= 30 and header[23:26] == b"\x9d\x01\x2a":
        width, height = struct.unpack("<HH", header[26:30])
        return width & 0x3FFF, height & 0x3FFF
    if chunk == b"VP8L" and len(header) >= 25 and header[20] == 0x2F:
        bits = int.from_bytes(header[21:25], "little")
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    raise ValueError("unsupported WebP encoding")


def svg_size(path: Path) -> tuple[int, int]:
    root = ET.parse(path).getroot()

    def integer(value: str | None) -> int:
        if value is None:
            raise ValueError("SVG is missing width or height")
        number = value.strip().lower().removesuffix("px")
        parsed = float(number)
        if not parsed.is_integer() or parsed <= 0:
            raise ValueError("SVG width and height must be positive integers")
        return int(parsed)

    return integer(root.get("width")), integer(root.get("height"))


def image_size(path: Path) -> tuple[int, int]:
    suffix = path.suffix.lower()
    if suffix == ".png":
        return png_size(path)
    if suffix == ".webp":
        return webp_size(path)
    if suffix == ".svg":
        return svg_size(path)
    raise ValueError(f"unsupported asset type: {suffix or '<none>'}")


def validate(manifest_path: Path) -> list[str]:
    errors: list[str] = []
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"cannot read manifest: {error}"]

    if not isinstance(manifest, dict):
        return ["manifest root must be an object"]
    if not isinstance(manifest.get("campaign"), str) or not manifest["campaign"].strip():
        errors.append("campaign must be a non-empty string")
    if manifest.get("claims_reviewed") is not True:
        errors.append("claims_reviewed must be true after the final copy review")

    assets = manifest.get("assets")
    if not isinstance(assets, list) or not assets:
        errors.append("assets must be a non-empty array")
        return errors

    kit_root = manifest_path.resolve().parent
    seen: set[str] = set()
    for index, asset in enumerate(assets):
        label = f"assets[{index}]"
        if not isinstance(asset, dict):
            errors.append(f"{label} must be an object")
            continue
        relative = asset.get("path")
        role = asset.get("role")
        width = asset.get("width")
        height = asset.get("height")
        max_bytes = asset.get("max_bytes")
        if not isinstance(relative, str) or not relative.strip():
            errors.append(f"{label}.path must be a non-empty string")
            continue
        relative_path = Path(relative)
        if relative_path.is_absolute() or ".." in relative_path.parts:
            errors.append(f"{label}.path must stay inside the campaign kit")
            continue
        normalized = relative_path.as_posix()
        if normalized in seen:
            errors.append(f"{label}.path duplicates {normalized}")
            continue
        seen.add(normalized)
        if not isinstance(role, str) or not role.strip():
            errors.append(f"{label}.role must be a non-empty string")
        if type(width) is not int or width <= 0 or type(height) is not int or height <= 0:
            errors.append(f"{label} width and height must be positive integers")
            continue
        if max_bytes is not None and (type(max_bytes) is not int or max_bytes <= 0):
            errors.append(f"{label}.max_bytes must be a positive integer")
            continue

        asset_path = (kit_root / relative_path).resolve()
        try:
            asset_path.relative_to(kit_root)
        except ValueError:
            errors.append(f"{label}.path resolves outside the campaign kit")
            continue
        if not asset_path.is_file():
            errors.append(f"{label}.path does not exist: {normalized}")
            continue
        try:
            actual = image_size(asset_path)
        except (OSError, ValueError, ET.ParseError) as error:
            errors.append(f"{label} cannot be inspected: {error}")
            continue
        if actual != (width, height):
            errors.append(
                f"{label} expected {width}x{height}, found {actual[0]}x{actual[1]}"
            )
        if max_bytes is not None and asset_path.stat().st_size > max_bytes:
            errors.append(
                f"{label} exceeds max_bytes: {asset_path.stat().st_size} > {max_bytes}"
            )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="path to campaign-manifest.json")
    args = parser.parse_args()

    errors = validate(args.manifest)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    manifest = args.manifest.resolve()
    asset_count = len(json.loads(manifest.read_text(encoding="utf-8"))["assets"])
    print(f"Validated {asset_count} campaign asset(s) from {manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
