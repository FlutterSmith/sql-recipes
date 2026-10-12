"""Keeps a generated block in every recipe.md: the queries and the result rows.

GitHub readers see the SQL without opening the query files, and the block can
never drift from them because ``cook generate`` rewrites it.
"""

from __future__ import annotations

import json
from typing import Any

from cook.engines import DIALECTS, LABELS
from cook.model import Recipe

START = "<!-- cook:sync -->"
END = "<!-- /cook:sync -->"


def _cell(value: Any) -> str:
    if value is None:
        return "*NULL*"
    if isinstance(value, dict | list):
        return "`" + json.dumps(value, ensure_ascii=False) + "`"
    return str(value).replace("|", "\\|")


def result_table(rows: list[dict[str, Any]]) -> str:
    columns = list(rows[0])
    out = [
        "| " + " | ".join(f"`{c}`" for c in columns) + " |",
        "|" + "---|" * len(columns),
    ]
    out += ["| " + " | ".join(_cell(r.get(c)) for c in columns) + " |" for r in rows]
    return "\n".join(out) + "\n"


def _fence(label: str, file: str, sql: str) -> str:
    return f"**{label}** (`{file}`):\n\n```sql\n{sql.rstrip()}\n```\n\n"


def sync_block(recipe: Recipe) -> str:
    out = ["\n## The query\n\n"]
    shared = [d for d in recipe.dialects if not recipe.is_variant(d)]
    if shared:
        names = ", ".join(LABELS[d] for d in shared)
        out.append(_fence(names, "query.sql", recipe.query(shared[0])))
    for d in DIALECTS:
        if d in recipe.unsupported:
            out.append(f"**{LABELS[d]}:** not supported. {recipe.unsupported[d]}\n\n")
        elif recipe.is_variant(d):
            out.append(_fence(LABELS[d], f"query.{d}.sql", recipe.query(d)))
    out.append("## The result\n\n")
    if recipe.fixture:
        link = f"[`{recipe.fixture}` fixture](../../_fixtures/{recipe.fixture}.sql)"
        extra = " and `setup.sql`" if (recipe.dir / "setup.sql").is_file() else ""
        out.append(f"Starting from the {link}{extra}, every engine returns:\n\n")
    else:
        out.append("Starting from `setup.sql`, every engine returns:\n\n")
    out.append(result_table(recipe.expected))
    return "".join(out)


def synced_page(recipe: Recipe) -> str:
    """The full recipe.md text with the generated block refreshed."""
    text = recipe.page.read_text(encoding="utf-8")
    block = f"{START}\n{sync_block(recipe)}{END}\n"
    start, end = text.find(START), text.find(END)
    if start != -1 and end != -1:
        return text[:start] + block + text[end + len(END) :].lstrip("\n")
    return text.rstrip("\n") + "\n\n" + block


def strip_block(body: str) -> str:
    """``body`` without the generated block (for validation and the site)."""
    start, end = body.find(START), body.find(END)
    if start == -1 or end == -1:
        return body
    return body[:start] + body[end + len(END) :]
