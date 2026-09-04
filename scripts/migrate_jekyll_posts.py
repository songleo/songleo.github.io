#!/usr/bin/env python3
"""Convert this repository's Jekyll posts to AstroPaper content entries."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path


FRONTMATTER_BOUNDARY = "---"
DATE_PREFIX = re.compile(r"^(\d{4})-(\d{2})-(\d{2})-")
MARKDOWN_LINK = re.compile(r"!?\[([^\]]*)\]\([^)]*\)")
HTML_TAG = re.compile(r"<[^>]+>")
INLINE_MARKUP = re.compile(r"[`*_~]+")


def scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        quote = value[0]
        value = value[1:-1]
        if quote == "'":
            value = value.replace("''", "'")
    return value


def split_post(text: str) -> tuple[dict[str, str], str]:
    lines = text.replace("\r\n", "\n").split("\n")
    if not lines or lines[0].strip() != FRONTMATTER_BOUNDARY:
        return {}, "\n".join(lines).lstrip("\n")

    try:
        end = next(
            index
            for index, line in enumerate(lines[1:], start=1)
            if line.strip() == FRONTMATTER_BOUNDARY
        )
    except StopIteration as exc:
        raise ValueError("front matter is not closed") from exc

    metadata: dict[str, str] = {}
    for line in lines[1:end]:
        match = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if match:
            metadata[match.group(1)] = scalar(match.group(2))
    return metadata, "\n".join(lines[end + 1 :]).lstrip("\n")


def normalize_datetime(raw: str, filename: str) -> str:
    value = scalar(raw)
    if not value:
        match = DATE_PREFIX.match(filename)
        if not match:
            raise ValueError("missing publication date")
        value = "-".join(match.groups()) + " 00:00:00"

    value = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone(timedelta(hours=8)))
    return parsed.isoformat(timespec="seconds")


def make_description(body: str, title: str) -> str:
    in_fence = False
    candidates: list[str] = []

    for raw_line in body.splitlines():
        line = raw_line.strip()
        if line.startswith(("```", "~~~")):
            in_fence = not in_fence
            continue
        if in_fence or not line:
            if candidates:
                break
            continue
        if line.startswith(("#", "{%", "{{", "<!--")):
            continue

        line = re.sub(r"^[-*+>]\s+", "", line)
        line = MARKDOWN_LINK.sub(lambda match: match.group(1), line)
        line = HTML_TAG.sub("", line)
        line = INLINE_MARKUP.sub("", line)
        line = re.sub(r"\s+", " ", line).strip()
        if not line or re.fullmatch(r"https?://\S+", line):
            continue
        candidates.append(line)
        if sum(len(item) for item in candidates) >= 120:
            break

    description = " ".join(candidates) or title
    if len(description) > 150:
        description = description[:147].rstrip() + "..."
    return description


def migrate(source: Path, destination: Path) -> tuple[int, int]:
    destination.mkdir(parents=True, exist_ok=True)
    migrated = 0
    drafts = 0

    for source_file in sorted(source.glob("*.md")):
        metadata, body = split_post(source_file.read_text(encoding="utf-8-sig"))
        title = scalar(metadata.get("title", "")) or source_file.stem
        is_draft = source_file.name == "token-killer.md"
        raw_date = metadata.get("date", "")
        if is_draft and not raw_date:
            raw_date = "2026-09-02T19:11:36+08:00"

        description = make_description(body, title)
        frontmatter = [
            FRONTMATTER_BOUNDARY,
            f"title: {json.dumps(title, ensure_ascii=False)}",
            f"description: {json.dumps(description, ensure_ascii=False)}",
            f"pubDatetime: {normalize_datetime(raw_date, source_file.name)}",
        ]
        if is_draft:
            frontmatter.append("draft: true")
            drafts += 1
        frontmatter.extend([FRONTMATTER_BOUNDARY, ""])

        target = destination / source_file.name
        body = re.sub(r"(?m)^```golang\\s*$", "```go", body)
        target.write_text("\n".join(frontmatter) + body.rstrip() + "\n", encoding="utf-8")
        migrated += 1

    return migrated, drafts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    migrated, drafts = migrate(args.source, args.destination)
    print(f"migrated={migrated} drafts={drafts}")


if __name__ == "__main__":
    main()
