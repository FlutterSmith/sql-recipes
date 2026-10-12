---
title: "Path from the root"
summary: "Each employee's chain of command as one string, built up through the recursion."
tags: [cte, text]
fixture: hr
ordered: true
related: [walk-a-hierarchy]
published: 2026-10-12
---

`Nadia > Rosa > Sam` tells you at a glance where Sam sits. The path is built one step at a time: each level appends its name to its manager's path.

## How it works

- The anchor starts the path with the root's name.
- Each recursive step takes the parent's path and appends `' > '` and the child's name.
- Sorting by the path groups each manager with their reports, because a manager's path is a prefix of each report's path.

## Differences

- The anchor decides the column's type. On PostgreSQL, `name` is `VARCHAR(100)` and the recursive step produces plain `VARCHAR`, which it refuses to mix, so the anchor is cast to `VARCHAR`.
- MySQL goes further and sizes the column from the anchor's first value, so a path that starts as `'Nadia'` would be cut to five characters. Cast the anchor to `CHAR(200)` to reserve room, and concatenate with `CONCAT`, since `||` means `OR` there.
- SQLite and DuckDB accept the query either way.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, DuckDB** (`query.sql`):

```sql
WITH RECURSIVE chain AS (
    SELECT id, name, CAST(name AS VARCHAR) AS path
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, c.path || ' > ' || e.name
    FROM employees AS e
    JOIN chain AS c ON e.manager_id = c.id
)
SELECT name, path
FROM chain
ORDER BY path
```

**MySQL** (`query.mysql.sql`):

```sql
WITH RECURSIVE chain AS (
    SELECT id, name, CAST(name AS CHAR(200)) AS path
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, CONCAT(c.path, ' > ', e.name)
    FROM employees AS e
    JOIN chain AS c ON e.manager_id = c.id
)
SELECT name, path
FROM chain
ORDER BY path
```

## The result

Starting from the [`hr` fixture](../../_fixtures/hr.sql), every engine returns:

| `name` | `path` |
|---|---|
| Nadia | Nadia |
| Omar | Nadia > Omar |
| Quentin | Nadia > Omar > Quentin |
| Priya | Nadia > Priya |
| Rosa | Nadia > Rosa |
| Sam | Nadia > Rosa > Sam |
| Tariq | Nadia > Rosa > Tariq |
| Uma | Nadia > Uma |
| Viktor | Nadia > Uma > Viktor |
<!-- /cook:sync -->
