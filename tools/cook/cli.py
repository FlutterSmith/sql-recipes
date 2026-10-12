"""Command line entry point: ``cook <command>``."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from cook.engines import DIALECTS, available
from cook.model import Repo
from cook.run import run_all


def find_root(start: Path) -> Path:
    for path in [start, *start.parents]:
        if (path / "pyproject.toml").is_file() and (path / "recipes").is_dir():
            return path
    raise SystemExit("cook: run this inside the sql-recipes repository")


MARK = {"pass": "✓", "fail": "✗", "error": "!", "unsupported": "–"}


def cmd_run(repo: Repo, slugs: list[str], only: set[str], verbose: bool) -> int:
    engines = available(only or None)
    if not engines:
        raise SystemExit("cook: no engines available (set PGURL and MYSQL_URL)")
    recipes = [r for r in repo.ordered() if not slugs or r.slug in slugs]
    results = run_all(recipes, engines)
    width = max(len(r.slug) for r in recipes) if recipes else 10
    print(f"{'recipe':<{width}}  " + "  ".join(f"{d:>8}" for d in engines))
    bad = 0
    for recipe in recipes:
        cells = []
        for d in engines:
            o = results[recipe.slug][d]
            cells.append(f"{MARK[o.status]:>8}")
            if o.status in ("fail", "error"):
                bad += 1
        print(f"{recipe.slug:<{width}}  " + "  ".join(cells))
        for d in engines:
            o = results[recipe.slug][d]
            if o.status in ("fail", "error") or (verbose and o.detail):
                for line in o.detail.splitlines():
                    print(f"    {d}: {line}", file=sys.stderr)
    missing = [d for d in DIALECTS if d not in engines]
    if missing:
        print(f"(not run here: {', '.join(missing)})")
    print(f"{len(recipes)} recipes, {bad} problem(s)")
    return 1 if bad else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="cook", description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("run", help="run recipes on the available engines")
    p.add_argument("slugs", nargs="*")
    p.add_argument("-e", "--engine", action="append", default=[], choices=DIALECTS)
    p.add_argument("-v", "--verbose", action="store_true")
    sub.add_parser("validate", help="check the content rules")
    p = sub.add_parser(
        "generate", help="write MATRIX.md, the README catalog and site data"
    )
    p.add_argument("--check", action="store_true")
    p.add_argument("--site", action="store_true")
    p = sub.add_parser("new", help="scaffold a recipe")
    p.add_argument("category")
    p.add_argument("slug")
    args = parser.parse_args(argv)

    repo = Repo.load(find_root(Path.cwd()))
    if args.command == "run":
        return cmd_run(repo, args.slugs, set(args.engine), args.verbose)
    if args.command == "validate":
        from cook.validate import validate

        problems = validate(repo)
        for problem in problems:
            print(f"  ✗ {problem}", file=sys.stderr)
        if problems:
            print(f"{len(problems)} problem(s)", file=sys.stderr)
            return 1
        print(f"{len(repo.recipes)} recipes valid.")
        return 0
    if args.command == "generate":
        from cook.generate import generate

        stale = generate(repo, check=args.check, site=args.site)
        if args.check:
            for path in stale:
                print(
                    f"  ✗ {path} is out of date; run `cook generate`", file=sys.stderr
                )
            if stale:
                return 1
            print("Generated files are current.")
            return 0
        print(
            f"Wrote {len(stale)} file(s)."
            + (" Site data written." if args.site else "")
        )
        return 0
    from cook.scaffold import new

    return new(repo, args.category, args.slug)


if __name__ == "__main__":
    raise SystemExit(main())
