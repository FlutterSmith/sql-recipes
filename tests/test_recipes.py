"""Every recipe, on every engine available here, must return expected.json."""

from __future__ import annotations

import pytest

from cook.engines import Engine
from cook.model import Recipe
from cook.run import run_one
from tests.conftest import engine_params, recipe_params


@pytest.mark.parametrize("engine", engine_params())
@pytest.mark.parametrize("recipe", recipe_params())
def test_recipe(recipe: Recipe, engine: Engine) -> None:
    outcome = run_one(recipe, engine)
    if outcome.status == "unsupported":
        pytest.skip(f"{engine.dialect}: {outcome.detail}")
    assert outcome.status == "pass", (
        f"{recipe.slug} on {engine.dialect}:\n{outcome.detail}"
    )
