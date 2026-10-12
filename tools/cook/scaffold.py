"""``cook new``: scaffold a recipe folder."""

from __future__ import annotations

from datetime import date

from cook.model import Repo

PAGE = """---
title: TODO
summary: TODO, one sentence.
tags: []
fixture: shop
ordered: false
published: {today}
---

One or two sentences: the problem, in plain words.

## How it works

- TODO

## Differences

- TODO: what changes between engines, or "None: the query is standard SQL."
"""

QUERY = """SELECT
    1 AS todo
"""


def new(repo: Repo, category: str, slug: str) -> int:
    if category not in {c["id"] for c in repo.categories}:
        raise SystemExit(f"cook: unknown category {category!r}")
    folder = repo.root / "recipes" / category / slug
    if folder.exists():
        raise SystemExit(f"cook: {folder.relative_to(repo.root)} already exists")
    folder.mkdir(parents=True)
    (folder / "recipe.md").write_text(PAGE.format(today=date.today().isoformat()))
    (folder / "query.sql").write_text(QUERY)
    (folder / "expected.json").write_text('[\n  {"todo": 1}\n]\n')
    print(f"Created {folder.relative_to(repo.root)}/")
    print("Next: write query.sql (and query.<dialect>.sql where an engine differs),")
    print("fill expected.json, then `cook run " + slug + "`.")
    return 0
