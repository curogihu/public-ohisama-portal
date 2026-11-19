"""Check the reviewed file allowlist and scan source, docs, assets and fixtures."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
LOCAL_DIRECTORIES = {".git", "node_modules", ".next", "__pycache__", ".venv", "output", "dist", "test-results", "playwright-report"}
LOCAL_FILES = {"tsconfig.tsbuildinfo"}
PATTERNS = [
    re.compile(r"(?:tver[.]jp|youtube[.]com|youtu[.]be|x[.]com|twitter[.]com|radiko[.]jp)", re.I),
    re.compile(r"(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16})"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"(?:https?://)[^\s/@]+:[^\s/@]+@", re.I),
]


def reviewed_files(root: Path) -> list[str]:
    manifest = root / "public-files.json"
    entries = json.loads(manifest.read_text(encoding="utf-8"))
    if not isinstance(entries, list) or not entries or len(entries) != len(set(entries)):
        raise ValueError("Invalid public file allowlist")
    for entry in entries:
        path = Path(entry)
        if path.is_absolute() or ".." in path.parts or "\\" in entry or not entry:
            raise ValueError("Unsafe allowlist path")
        if path.parts[0] in LOCAL_DIRECTORIES or entry in LOCAL_FILES:
            raise ValueError("Local artifacts cannot be published")
    return entries


def verify(root: Path) -> list[str]:
    root = root.resolve()
    problems: list[str] = []
    try:
        expected = set(reviewed_files(root))
    except (ValueError, OSError, TypeError):
        return ["public-files.json: invalid or missing allowlist"]
    actual: set[str] = set()
    for directory, folders, files in os.walk(root, followlinks=False):
        for folder in list(folders):
            path = Path(directory) / folder
            if path.is_symlink():
                problems.append(f"{path.relative_to(root).as_posix()}: symbolic link is not allowed")
                folders.remove(folder)
            elif folder in LOCAL_DIRECTORIES:
                folders.remove(folder)
        for name in files:
            path = Path(directory) / name
            relative = path.relative_to(root).as_posix()
            if name in LOCAL_FILES:
                continue
            actual.add(relative)
            if path.is_symlink():
                problems.append(f"{relative}: symbolic link is not allowed")
                continue
            if name.startswith(".env") and name != ".env.example":
                problems.append(f"{relative}: local environment file is not allowed")
            try:
                content = path.read_text(encoding="utf-8-sig")
            except (UnicodeError, OSError):
                problems.append(f"{relative}: unreviewable binary or unreadable file")
                continue
            if any(pattern.search(content) for pattern in PATTERNS):
                problems.append(f"{relative}: restricted service URL or credential pattern")
            if relative.startswith(("data/", "samples/")) and path.suffix == ".json":
                try:
                    validate_fixture(json.loads(content))
                except (ValueError, TypeError):
                    problems.append(f"{relative}: invalid demo data or non-example URL")
    problems.extend(f"{entry}: not in reviewed file allowlist" for entry in sorted(actual - expected))
    problems.extend(f"{entry}: allowlisted file missing" for entry in sorted(expected - actual))
    return problems


def validate_fixture(value: object) -> None:
    if isinstance(value, dict):
        for key, item in value.items():
            if key == "fictional" and item is not True:
                raise ValueError("Synthetic data required")
            if key == "id" and (not isinstance(item, str) or not item.startswith(("sample-", "demo-"))):
                raise ValueError("Synthetic IDs required")
            if key == "members" and isinstance(item, list) and item and isinstance(item[0], str):
                if any(not isinstance(member, str) or not (member.startswith("sample-") or member in {"tver", "youtube-movie", "youtube-shorts", "youtube-live", "audio", "column"}) for member in item):
                    raise ValueError("Unknown demo member")
            if key == "url":
                url = urlsplit(item)
                if url.scheme != "https" or url.netloc != "example.com":
                    raise ValueError("Only example URLs supported")
            if key in {"thumbnail", "profileImage"} and item != "/placeholder.svg":
                raise ValueError("Local placeholder required")
            validate_fixture(item)
    elif isinstance(value, list):
        for item in value:
            validate_fixture(item)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    problems = verify(args.root)
    for problem in problems:
        print(problem, file=sys.stderr)
    if problems:
        return 1
    print("Public file allowlist, source and synthetic-data checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
