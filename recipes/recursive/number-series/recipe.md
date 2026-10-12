---
title: "Generate a series of numbers"
summary: "The numbers 1 to 5 and their squares, from nothing, with a recursive CTE or generate_series."
tags: [cte]
ordered: true
related: [generate-date-series, walk-a-hierarchy]
published: 2026-10-12
---

Sometimes you need rows that aren't in any table: a sequence to join against, slots in a schedule, test data. A recursive CTE counts up from 1 on any engine, and two engines have a function for it.

## How it works

- The anchor row is `1`.
- Each step adds one until the `WHERE` stops it. Without the `WHERE` the query never ends.
- The outer query uses the series like any table.

## Differences

- PostgreSQL and DuckDB: `generate_series(1, 5)` as a table function is shorter and faster.
- MySQL caps recursion at `cte_max_recursion_depth` (1000 by default). SQLite has no limit, so get the `WHERE` right.

<!-- cook:sync -->

## The query

**SQLite, MySQL** (`query.sql`):

```sql
WITH RECURSIVE series AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1
    FROM series
    WHERE n < 5
)
SELECT n, n * n AS square
FROM series
ORDER BY n
```

**PostgreSQL** (`query.postgres.sql`):

```sql
SELECT n, n * n AS square
FROM generate_series(1, 5) AS s(n)
ORDER BY n
```

**DuckDB** (`query.duckdb.sql`):

```sql
SELECT n, n * n AS square
FROM generate_series(1, 5) AS s(n)
ORDER BY n
```

## The result

Starting from `setup.sql`, every engine returns:

| `n` | `square` |
|---|---|
| 1 | 1 |
| 2 | 4 |
| 3 | 9 |
| 4 | 16 |
| 5 | 25 |
<!-- /cook:sync -->
