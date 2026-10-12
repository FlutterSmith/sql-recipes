"""Shared fixtures: the recipe tree and the engines this machine can reach."""

from __future__ import annotations

from pathlib import Path

import pytest
from _pytest.mark.structures import ParameterSet

from cook.engines import DIALECTS, Engine, available
from cook.model import Recipe, Repo

ROOT = Path(__file__).resolve().parents[1]
REPO = Repo.load(ROOT)
ENGINES = available()


def pytest_configure(config: pytest.Config) -> None:
    missing = [d for d in DIALECTS if d not in ENGINES]
    if missing:
        hint = "set PGURL and MYSQL_URL to run them"
        print(f"\nengines not available here: {', '.join(missing)} ({hint})")


@pytest.fixture(scope="session")
def repo() -> Repo:
    return REPO


def recipe_params() -> list[ParameterSet]:
    return [pytest.param(r, id=r.slug) for r in REPO.ordered()]


def engine_params() -> list[ParameterSet]:
    return [pytest.param(e, id=d) for d, e in ENGINES.items()]


__all__ = [
    "ENGINES",
    "REPO",
    "ROOT",
    "Engine",
    "Recipe",
    "engine_params",
    "recipe_params",
]
