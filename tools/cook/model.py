"""Loads the recipe tree: fixtures, recipes, categories and tags."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from functools import cached_property
from pathlib import Path
from typing import Any

import yaml

from cook.engines import DIALECTS

FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)


class ContentError(Exception):
    """A content file can't be read at all."""


def read_frontmatter(path: Path) -> tuple[dict[str, Any], str]:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER.match(text)
    if not match:
        raise ContentError(f"{path}: missing --- frontmatter ---")
    data = yaml.safe_load(match.group(1)) or {}
    if not isinstance(data, dict):
        raise ContentError(f"{path}: frontmatter must be a mapping")
    return data, text[match.end() :]


@dataclass
class Recipe:
    """One problem, with a query per dialect and the rows they must return."""

    root: Path
    dir: Path
    meta: dict[str, Any]
    body: str

    @property
    def slug(self) -> str:
        return self.dir.name

    @property
    def category(self) -> str:
        return self.dir.parent.name

    @property
    def page(self) -> Path:
        return self.dir / "recipe.md"

    @property
    def fixture(self) -> str | None:
        value = self.meta.get("fixture")
        return str(value) if value else None

    @property
    def ordered(self) -> bool:
        return bool(self.meta.get("ordered", False))

    @property
    def unsupported(self) -> dict[str, str]:
        value = self.meta.get("unsupported") or {}
        return {str(k): str(v) for k, v in value.items()}

    def _file(self, kind: str, dialect: str) -> Path | None:
        own = self.dir / f"{kind}.{dialect}.sql"
        if own.is_file():
            return own
        shared = self.dir / f"{kind}.sql"
        return shared if shared.is_file() else None

    def query_file(self, dialect: str) -> Path | None:
        """The query this dialect runs, or None when it's unsupported."""
        if dialect in self.unsupported:
            return None
        return self._file("query", dialect)

    def query(self, dialect: str) -> str:
        path = self.query_file(dialect)
        if path is None:
            raise ContentError(f"{self.slug}: no query for {dialect}")
        return path.read_text(encoding="utf-8").strip() + "\n"

    def is_variant(self, dialect: str) -> bool:
        path = self.query_file(dialect)
        return path is not None and path.name != "query.sql"

    def setup(self, dialect: str) -> str:
        parts = []
        if self.fixture:
            fixture = self.root / "recipes" / "_fixtures" / f"{self.fixture}.sql"
            parts.append(fixture.read_text(encoding="utf-8"))
        own = self._file("setup", dialect)
        if own:
            parts.append(own.read_text(encoding="utf-8"))
        return "\n".join(parts)

    @cached_property
    def expected(self) -> list[dict[str, Any]]:
        data = json.loads((self.dir / "expected.json").read_text(encoding="utf-8"))
        return list(data)

    @property
    def dialects(self) -> list[str]:
        return [d for d in DIALECTS if self.query_file(d) is not None]


@dataclass
class Repo:
    """Everything ``cook`` reads, rooted at the repository directory."""

    root: Path
    recipes: list[Recipe] = field(default_factory=list)

    @classmethod
    def load(cls, root: Path) -> Repo:
        repo = cls(root)
        for page in sorted((root / "recipes").glob("*/*/recipe.md")):
            if page.parent.parent.name.startswith("_"):
                continue
            meta, body = read_frontmatter(page)
            repo.recipes.append(Recipe(root, page.parent, meta, body))
        return repo

    @cached_property
    def categories(self) -> list[dict[str, str]]:
        data: list[dict[str, str]] = yaml.safe_load(
            (self.root / "recipes" / "categories.yaml").read_text(encoding="utf-8")
        )
        return data

    @cached_property
    def tags(self) -> dict[str, str]:
        data: dict[str, str] = yaml.safe_load(
            (self.root / "recipes" / "tags.yaml").read_text(encoding="utf-8")
        )
        return data

    @cached_property
    def fixtures(self) -> dict[str, str]:
        folder = self.root / "recipes" / "_fixtures"
        return {
            p.stem: p.read_text(encoding="utf-8") for p in sorted(folder.glob("*.sql"))
        }

    def by_slug(self) -> dict[str, Recipe]:
        return {r.slug: r for r in self.recipes}

    def ordered(self) -> list[Recipe]:
        rank = {c["id"]: i for i, c in enumerate(self.categories)}
        return sorted(self.recipes, key=lambda r: (rank.get(r.category, 99), r.slug))
