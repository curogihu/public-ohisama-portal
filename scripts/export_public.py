"""Export reviewed files to a NEW directory, without Git history or local artifacts."""
import argparse
from pathlib import Path
import shutil
import sys

from verify_public import ROOT, reviewed_files, verify


def export(root: Path, destination: Path) -> None:
    root, destination = root.resolve(), destination.resolve()
    if root == destination or root in destination.parents or destination in root.parents:
        raise ValueError("Export must be outside the source tree")
    if destination.exists():
        raise ValueError("Export requires a new destination directory")
    if verify(root):
        raise ValueError("Public verification failed; export stopped")
    destination.mkdir(parents=True)
    for relative in reviewed_files(root):
        source, target = root / relative, destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    if verify(destination):
        raise ValueError("Exported files failed verification")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        export(ROOT, args.output)
    except (ValueError, OSError) as error:
        print(f"Export stopped: {error}", file=sys.stderr)
        return 1
    print("Reviewed public files exported; Git history and local artifacts excluded")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
