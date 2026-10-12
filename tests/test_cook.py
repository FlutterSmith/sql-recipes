"""The cook CLI itself: SQL splitting, normalisation, comparison and content rules."""

from __future__ import annotations

import datetime as dt
from decimal import Decimal
from pathlib import Path

import pytest

from cook.cli import main
from cook.engines import SQLite, normalize
from cook.model import Repo
from cook.run import diff
from cook.sql import adapt_setup, split_statements
from cook.validate import validate, word_count
from tests.conftest import REPO, ROOT


def test_split_statements_respects_quotes_and_comments() -> None:
    sql = """
    -- a comment; with a semicolon
    INSERT INTO t VALUES ('a;b', "c;d"); /* block; comment */
    SELECT 'it''s' AS s;
    """
    assert split_statements(sql) == [
        """INSERT INTO t VALUES ('a;b', "c;d")""",
        "SELECT 'it''s' AS s",
    ]


def test_adapt_setup_rewrites_mysql_types_only() -> None:
    sql = "CREATE TABLE t (at TIMESTAMP, id TEXT PRIMARY KEY)"
    assert (
        adapt_setup(sql, "mysql")
        == "CREATE TABLE t (at DATETIME, id VARCHAR(100) PRIMARY KEY)"
    )
    assert adapt_setup(sql, "postgres") == sql


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (Decimal("4.50"), 4.5),
        (Decimal("49.00"), 49),
        (0.1 + 0.2, 0.3),
        (dt.date(2024, 2, 1), "2024-02-01"),
        (dt.datetime(2024, 2, 1, 9, 15), "2024-02-01 09:15:00"),
        ("2024-02-01T09:15:00", "2024-02-01 09:15:00"),
        ('{"a": [1, 2]}', {"a": [1, 2]}),
        ("[not json", "[not json"),
        (True, True),
        (None, None),
    ],
)
def test_normalize(value: object, expected: object) -> None:
    assert normalize(value) == expected


def test_diff_ignores_order_unless_asked() -> None:
    a = [{"id": 1}, {"id": 2}]
    b = [{"id": 2}, {"id": 1}]
    assert diff(a, b, ordered=False) == ""
    assert "row 0" in diff(a, b, ordered=True)
    assert "expected 2 row(s), got 1" in diff(a, [{"id": 1}], ordered=False)


def test_sqlite_engine_returns_lowercase_columns() -> None:
    rows = SQLite().run(
        "CREATE TABLE t (n INTEGER); INSERT INTO t VALUES (1);",
        "SELECT n AS Total FROM t",
    )
    assert rows == [{"total": 1}]


def test_word_count() -> None:
    assert word_count("`ROW_NUMBER()` numbers -- each row.") == 4


def test_the_real_repository_is_valid() -> None:
    assert validate(REPO) == []
    assert len(REPO.recipes) >= 50


def test_every_recipe_has_a_shared_or_per_dialect_query() -> None:
    for recipe in REPO.recipes:
        assert len(recipe.dialects) + len(recipe.unsupported) == 4, recipe.slug


def test_validate_catches_problems(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import shutil

    shutil.copytree(ROOT / "recipes", tmp_path / "recipes")
    shutil.copy(ROOT / "pyproject.toml", tmp_path / "pyproject.toml")
    page = tmp_path / "recipes/aggregation/median/recipe.md"
    text = page.read_text().replace("tags: [window, cte]", "tags: [window, nope]")
    page.write_text(text.replace("## Differences", "Simply put.\n\n## Differences"))
    (tmp_path / "recipes/aggregation/median/query.mysql.sql").write_text(
        "SELECT * FROM t ORDER BY 1"
    )
    problems = validate(Repo.load(tmp_path))
    where = "recipes/aggregation/median"
    assert f"{where}: unknown tag 'nope' (add it to recipes/tags.yaml)" in problems
    assert f"{where}: avoid 'simply'" in problems
    assert f"{where}: query.mysql.sql uses SELECT *; name the columns" in problems
    assert f"{where}: query.mysql.sql has ORDER BY, so set `ordered: true`" in problems
    monkeypatch.chdir(tmp_path)
    assert main(["validate"]) == 1


def test_new_scaffolds_a_recipe(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import shutil

    shutil.copytree(ROOT / "recipes", tmp_path / "recipes")
    shutil.copy(ROOT / "pyproject.toml", tmp_path / "pyproject.toml")
    monkeypatch.chdir(tmp_path)
    assert main(["new", "strings", "reverse-words"]) == 0
    assert (tmp_path / "recipes/strings/reverse-words/query.sql").is_file()
    with pytest.raises(SystemExit, match="already exists"):
        main(["new", "strings", "reverse-words"])
