"""Content rules. Returns human-readable problems; an empty list is a pass."""

from __future__ import annotations

import re
from collections.abc import Iterator
from datetime import date

from cook.engines import DIALECTS
from cook.model import Recipe, Repo
from cook.sync import strip_block

REQUIRED = ("title", "summary", "tags", "published")
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MAX_SUMMARY = 160
MAX_PROSE_WORDS = 260
BANNED = ("simply", "just ", "easy", "easily", "obviously", "of course", "let's",
          "dive into", "powerful", "seamless", "leverage")  # fmt: skip


def prose(body: str) -> str:
    return re.sub(r"```.*?```", "", strip_block(body), flags=re.DOTALL)


def top_level(sql: str) -> str:
    """``sql`` with everything inside parentheses removed."""
    out: list[str] = []
    depth = 0
    for ch in sql:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(depth - 1, 0)
        elif depth == 0:
            out.append(ch)
    return "".join(out)


def word_count(text: str) -> int:
    return len(re.findall(r"[\w'`.()-]*\w[\w'`.()-]*", text))


def _recipe(repo: Repo, r: Recipe) -> Iterator[str]:
    where = f"recipes/{r.category}/{r.slug}"
    for key in REQUIRED:
        if key not in r.meta:
            yield f"{where}: missing `{key}` in recipe.md"
    if not SLUG.match(r.slug):
        yield f"{where}: folder name must be kebab-case"
    if len(str(r.meta.get("summary", ""))) > MAX_SUMMARY:
        yield f"{where}: summary is over {MAX_SUMMARY} characters"
    for tag in r.meta.get("tags") or []:
        if tag not in repo.tags:
            yield f"{where}: unknown tag {tag!r} (add it to recipes/tags.yaml)"
    if not isinstance(r.meta.get("published"), date):
        yield f"{where}: published must be a YYYY-MM-DD date"
    if r.fixture and r.fixture not in repo.fixtures:
        yield f"{where}: unknown fixture {r.fixture!r}"
    known = repo.by_slug()
    for slug in r.meta.get("related") or []:
        if slug not in known or slug == r.slug:
            yield f"{where}: related {slug!r} is not another recipe"
    for dialect in r.unsupported:
        if dialect not in DIALECTS:
            yield f"{where}: unsupported names unknown dialect {dialect!r}"
        if (r.dir / f"query.{dialect}.sql").is_file():
            yield f"{where}: {dialect} is marked unsupported but has a query file"
    missing = [
        d for d in DIALECTS if d not in r.unsupported and r.query_file(d) is None
    ]
    if missing:
        yield f"{where}: no query for {', '.join(missing)}"
    if len(r.dialects) < 2:
        yield f"{where}: a recipe needs at least two engines"
    if not (r.dir / "expected.json").is_file():
        yield f"{where}: missing expected.json"
    elif not r.expected:
        yield f"{where}: expected.json must hold at least one row"
    for path in sorted(r.dir.glob("query*.sql")):
        text = path.read_text(encoding="utf-8")
        if "ORDER BY" in top_level(text).upper() and not r.ordered:
            yield f"{where}: {path.name} has ORDER BY, so set `ordered: true`"
        if re.search(r"\bselect\s+\*", text, re.IGNORECASE):
            yield f"{where}: {path.name} uses SELECT *; name the columns"
    text = prose(r.body)
    if (n := word_count(text)) > MAX_PROSE_WORDS:
        yield f"{where}: {n} words of prose; the limit is {MAX_PROSE_WORDS}"
    lowered = f"{r.meta.get('summary', '')} {text}".lower()
    for phrase in BANNED:
        if phrase in lowered:
            yield f"{where}: avoid {phrase.strip()!r}"
    for heading in ("## How it works", "## Differences"):
        if heading not in strip_block(r.body):
            yield f"{where}: needs a '{heading}' section"


def validate(repo: Repo) -> list[str]:
    problems: list[str] = []
    ids = {c["id"] for c in repo.categories}
    for recipe in repo.recipes:
        if recipe.category not in ids:
            problems.append(f"recipes/{recipe.category}: not in categories.yaml")
        problems += list(_recipe(repo, recipe))
    return problems
