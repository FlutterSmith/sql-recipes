---
title: "Walk a hierarchy"
summary: "Everyone under a manager, at any depth, with a recursive CTE."
tags: [cte]
fixture: hr
ordered: true
related: [path-from-root, number-series]
published: 2026-10-12
---

Org charts, folders, categories: a table where rows point at their parent. A self-join finds one level. A recursive CTE keeps joining until nothing new turns up.

## How it works

- The first `SELECT` (the anchor) is the starting row: Nadia, at depth 0.
- The second `SELECT` joins the rows found so far to their direct reports and adds one to the depth. It runs again on the new rows until it finds none.
- `UNION ALL` glues the levels together. `UNION` would also work and would stop a cycle, at the cost of de-duplicating every step.

## Differences

- None: `WITH RECURSIVE` is standard and all four engines accept it. MySQL and SQLite require the `RECURSIVE` keyword; PostgreSQL and DuckDB accept it.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
WITH RECURSIVE reports AS (
    SELECT id, name, 0 AS depth
    FROM employees
    WHERE id = 1
    UNION ALL
    SELECT e.id, e.name, r.depth + 1
    FROM employees AS e
    JOIN reports AS r ON e.manager_id = r.id
)
SELECT id, name, depth
FROM reports
ORDER BY depth, id
```

## The result

Starting from the [`hr` fixture](../../_fixtures/hr.sql), every engine returns:

| `id` | `name` | `depth` |
|---|---|---|
| 1 | Nadia | 0 |
| 2 | Omar | 1 |
| 3 | Priya | 1 |
| 5 | Rosa | 1 |
| 8 | Uma | 1 |
| 4 | Quentin | 2 |
| 6 | Sam | 2 |
| 7 | Tariq | 2 |
| 9 | Viktor | 2 |
<!-- /cook:sync -->
