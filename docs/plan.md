# sql-recipes: Plan

> Status: **shipped as v0.1**. Companion: [design.md](design.md).

## 0. The problem

Every SQL cheat sheet online has the same flaw. It gives you one query, and it quietly assumes one engine. The reader copies it, runs it, and gets a syntax error, because `string_agg` is `GROUP_CONCAT` here, because `FILTER` doesn't exist there, because `rank` is a reserved word on this one. The differences between SQLite, PostgreSQL, MySQL and DuckDB are small, numerous, and exactly the things nobody remembers.

The second flaw: nothing on those pages was ever run. The result shown next to the query is what the author believed it would return.

## 1. The idea

**One recipe per problem. One tested query per engine. Results checked on real servers before anything is published.**

- A recipe is a folder: the problem in prose, a shared standard-SQL query, per-engine variants only where needed, and the rows every engine must return.
- A harness (`cook`) loads a fixture into each engine, runs the query, and compares rows. CI runs it against PostgreSQL and MySQL in service containers, three versions each, plus SQLite and DuckDB in-process.
- The website turns the harness's results into ticks with versions, and lets the reader run the recipe in the browser on the engines that exist as WebAssembly.

## 2. Scope of v0.1

51 recipes in 10 categories:

| Category | Recipes |
|---|---|
| Filtering and lookup | 7: latest row per group, top N per group, anti join, `EXISTS`, null-safe equality, case-insensitive search, date ranges |
| Aggregation | 8: totals, conditional counts, string aggregation, percent of total, median, pivot, histogram, distinct counts |
| Window functions | 7: running total, the three ranking functions, `LAG`, moving average, first and last value, gaps and islands, `NTILE` |
| Joins and sets | 5: full outer join, lateral join, self-join pairs, `EXCEPT`, aggregating before joining |
| Duplicates and upserts | 5: find, delete, upsert, insert-if-missing, update from another table |
| Dates and times | 6: truncate to month, days between, generate a series, whole years, day of week, overlapping ranges |
| Strings | 5: split into rows, `CONCAT_WS`, zero padding, whitespace, text after a delimiter |
| JSON | 3: extract a field, array to rows, build JSON |
| Recursive queries | 3: walk a hierarchy, path from root, number series |
| Pagination | 2: offset, keyset |

Chosen by one rule: the problem has to be one people search for, and the answer has to differ between at least two of the engines or carry a trap on at least one of them. Problems where all four engines agree and nothing can go wrong (`SELECT ... WHERE`) aren't recipes.

## 3. The recipe format

```
recipes/<category>/<slug>/
├── recipe.md            frontmatter (title, summary, tags, fixture, ordered, unsupported, related)
│                        + lead paragraph + "How it works" + "Differences"
├── query.sql            the shared query, standard SQL
├── query.<dialect>.sql  an engine's own spelling, only where the shared query fails or the idiom is better
├── setup.sql            optional extra tables on top of the fixture
└── expected.json        the rows, as JSON
```

Three fixtures (`shop`, `hr`, `sensors`) are shared by most recipes, so the reader learns the data once. They are written in a portable subset of DDL; the harness rewrites the two type names that differ on MySQL.

An engine that can't do a recipe at all is listed under `unsupported` with a reason, and the matrix shows a dash. There is one in v0.1: SQLite has no `LATERAL` join.

## 4. How results are compared

Drivers disagree about types more than engines disagree about SQL. The harness normalises before comparing:

- `Decimal` and `float` compare as numbers, rounded to six places; whole floats compare as integers.
- `date`, `datetime` and SQLite's text timestamps all become `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`.
- JSON returned as text (SQLite, MySQL) is parsed, so it compares equal to PostgreSQL's `jsonb` and DuckDB's JSON.
- MySQL's `1` for a boolean compares equal to `true`.
- Column names are lower-cased. Every output column must be aliased, which is also good practice.

Rows are compared in order when the recipe has a top-level `ORDER BY` (`ordered: true`), and as a multiset otherwise.

## 5. CI

- `lint`: ruff, mypy `--strict`, `cook validate`.
- `recipes`: `cook run` and `pytest` on a matrix of PostgreSQL 16 / 17 / 18 × MySQL 8.0 / 8.4 / 9, with SQLite and DuckDB in-process.
- `site`: `cook generate --check` (MATRIX.md and the README catalog are current), `cook generate --site` (runs everything again and writes the site data with the versions), build, deploy.
- Weekly `freshness`: the newest engine images and drivers; opens an issue on drift.

## 6. What the engines rejected while writing v0.1

Every recipe was run locally on all four engines before it was kept. These are the rejections, in the order they came up. Each one became a line in a recipe's "Differences".

| Recipe | Engine | What happened |
|---|---|---|
| top-n-per-group, previous-and-next-row, first-and-last-per-group | MySQL 8.0 | `rank`, `change`, `first_value` and `last_value` are reserved words. MariaDB accepted them; real MySQL refused. The aliases became `place`, `delta`, `opening` and `latest`. |
| gaps-and-islands | PostgreSQL, DuckDB | `date - bigint` doesn't exist; `ROW_NUMBER()` returns a bigint. Cast it to an integer first. |
| build-json | DuckDB | `json_group_array` is a macro, not an aggregate, so it takes no `ORDER BY`. Sort in a subquery. |
| path-from-root | PostgreSQL | A recursive CTE's column takes its type from the anchor. `VARCHAR(100)` in the anchor and plain `VARCHAR` in the recursive term is a mismatch. Cast the anchor. |
| path-from-root | MySQL | Same column, worse: MySQL sizes it from the anchor's first value, so paths would be cut to five characters. Cast to `CHAR(200)`. |
| keyset-pagination | DuckDB | A row-value comparison won't cast a bare string inside the row. Write `TIMESTAMP '...'`. |
| delete-duplicates | MySQL | Error 1093: you can't read from the table you're deleting from in a subquery. Wrap the subquery in a derived table, or use a multi-table `DELETE`. |

The local MySQL was first a MariaDB 10.11 stand-in, which let the reserved-word aliases through. Swapping in MySQL 8.0 found them. Lesson kept: test on the real thing.

## 7. Later

- More recipes where the engines disagree: `UPSERT` with `RETURNING`, array columns, `MERGE`, `GROUPING SETS`, `TABLESAMPLE`, regular expressions.
- Oracle and SQL Server would make the matrix more useful; both have free developer images, and neither runs in a browser.
- `EXPLAIN` output per engine for the pagination recipes, so the cost claims are shown rather than told.
