# Contributing

Thanks for helping. The one rule that matters: a recipe is only here if it runs on every engine it claims to run on. CI enforces that on real servers. Everything below exists to keep it true.

## Quick start

```sh
uv sync
docker compose up -d                               # PostgreSQL 17 and MySQL 8.4
export PGURL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
export MYSQL_URL=mysql://root:root@127.0.0.1:3306

uv run cook new windows cumulative-distinct        # scaffold a recipe
# write query.sql, expected.json and recipe.md, then:
uv run cook run cumulative-distinct                # on every engine you can reach
uv run cook validate                               # content rules
uv run cook generate                               # MATRIX.md and the README catalog
```

Fixing prose only? Edit `recipe.md` and open a pull request. CI runs the engines.

## How a recipe is built

```
recipes/<category>/<slug>/
├── recipe.md            frontmatter + prose
├── query.sql            the shared query, standard SQL, used by every engine without its own file
├── query.<dialect>.sql  an engine's own spelling: sqlite, postgres, mysql or duckdb
├── setup.sql            optional extra tables, on top of the fixture (setup.<dialect>.sql to override)
└── expected.json        the rows the query must return, as a JSON array of objects
```

### The frontmatter

```yaml
---
title: Latest order per customer
summary: One sentence, at most 160 characters.
tags: [window, cte]            # from recipes/tags.yaml
fixture: shop                  # shop, hr or sensors, or leave it out and write setup.sql
ordered: true                  # the query has a top-level ORDER BY, so rows are compared in order
unsupported:                   # only when an engine can't do it at all
  sqlite: "SQLite has no LATERAL join. Use the window function in top-n-per-group."
related: [top-n-per-group]
published: 2026-10-12
---
```

### The queries

- `query.sql` is the shared query. Write it in standard SQL and let the engines that accept it use it. Put an engine's idiom in `query.<dialect>.sql` only when the shared query fails there or when the idiom is clearly the better answer on that engine (`DISTINCT ON`, `PIVOT`).
- Name every output column with `AS`. `expected.json` is matched by column name, in lower case.
- Avoid aliases that are reserved words somewhere. MySQL rejects `rank`, `change`, `first_value` and friends.
- A query may hold several statements (an `UPDATE` then a `SELECT`); the last one's rows are compared.
- No `SELECT *`.

### The expected rows

Write what the query returns, by hand, and let the engines prove you right. The comparison normalises what drivers disagree on: decimals and floats compare as numbers, dates and timestamps as `YYYY-MM-DD` and `YYYY-MM-DD HH:MM:SS` strings, JSON text as parsed JSON, and `1` equals `true`.

If a recipe has no top-level `ORDER BY`, rows are compared as a multiset. If it has one, set `ordered: true` and they are compared in order.

### The fixtures

`recipes/_fixtures/` holds three datasets every reader gets to know: `shop` (customers, products, orders, order items), `hr` (departments and employees with managers) and `sensors` (daily readings with a gap). Use them when you can, so results stay readable. Fixtures are portable SQL; the harness rewrites the few type names that differ (`TIMESTAMP` becomes `DATETIME` on MySQL).

### The prose

- A lead paragraph: the problem, in plain words, and why the obvious answer isn't enough.
- `## How it works`: two to four bullets.
- `## Differences`: one bullet per engine where something differs, naming the version when a feature arrived ("MySQL 8.0.31 added `EXCEPT`"). Write "None: standard SQL." when nothing does.
- At most 260 words. No emoji, no hype. `cook validate` rejects a list of filler words.

## Pull requests

One recipe per pull request. CI runs `cook run` against PostgreSQL 16, 17 and 18 and MySQL 8.0, 8.4 and 9. If a recipe passes locally and fails on one of them, that's a finding: add a note or a variant.
