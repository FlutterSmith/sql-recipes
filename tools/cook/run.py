"""Runs recipes on engines and compares what comes back with expected.json."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from cook.engines import Engine, Row, normalize
from cook.model import Recipe


@dataclass(frozen=True)
class Outcome:
    """What happened when one recipe ran on one engine."""

    dialect: str
    status: str  # "pass" | "fail" | "error" | "unsupported"
    detail: str = ""
    rows: list[Row] | None = None


def _key(row: Row) -> str:
    return json.dumps(row, sort_keys=True, default=str)


def diff(expected: list[Row], got: list[Row], *, ordered: bool) -> str:
    """An empty string when the rows match; otherwise a short explanation."""
    want = [{k.lower(): normalize(v) for k, v in r.items()} for r in expected]
    if not ordered:
        want = sorted(want, key=_key)
        got = sorted(got, key=_key)
    if want == got:
        return ""
    lines = [f"expected {len(want)} row(s), got {len(got)}"]
    for i, (w, g) in enumerate(zip(want, got, strict=False)):
        if w != g:
            lines.append(f"row {i}: expected {w}")
            lines.append(f"row {i}:      got {g}")
            break
    if len(want) != len(got):
        extra = got[len(want) :] if len(got) > len(want) else want[len(got) :]
        lines.append(f"unmatched: {extra[:1]}")
    return "\n".join(lines)


def run_one(recipe: Recipe, engine: Engine) -> Outcome:
    dialect = engine.dialect
    if dialect in recipe.unsupported:
        return Outcome(dialect, "unsupported", recipe.unsupported[dialect])
    if recipe.query_file(dialect) is None:
        return Outcome(dialect, "error", f"no query.sql or query.{dialect}.sql")
    try:
        rows = engine.run(recipe.setup(dialect), recipe.query(dialect))
    # Any driver error is a failed recipe, and the message is the diagnosis.
    except Exception as e:
        message = " ".join(str(e).split())
        return Outcome(dialect, "error", f"{type(e).__name__}: {message[:300]}")
    problem = diff(recipe.expected, rows, ordered=recipe.ordered)
    if problem:
        return Outcome(dialect, "fail", problem, rows)
    return Outcome(dialect, "pass", "", rows)


def run_all(
    recipes: list[Recipe], engines: dict[str, Engine]
) -> dict[str, dict[str, Outcome]]:
    """``{slug: {dialect: outcome}}`` for every recipe on every engine."""
    results: dict[str, dict[str, Outcome]] = {}
    for recipe in recipes:
        results[recipe.slug] = {d: run_one(recipe, e) for d, e in engines.items()}
    return results


def as_json(outcome: Outcome) -> dict[str, Any]:
    return {"status": outcome.status, "detail": outcome.detail}
