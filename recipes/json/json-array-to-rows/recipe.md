---
title: "Expand a JSON array into rows"
summary: "One row per element of a JSON array, next to the row it came from."
tags: [json]
ordered: true
related: [extract-json-field, split-string-into-rows]
published: 2026-10-12
---

Each event carries an array of tags. To count tags or join on them you need one row per tag. Each engine has a table-valued function for exactly this.

## How it works

- The function takes the array at `$.tags` and returns a row per element.
- Joining it to `events` keeps the event's id next to each tag.
- An empty array contributes no rows; use a `LEFT JOIN` (where the engine allows it) to keep those events.

## Differences

- PostgreSQL: `jsonb_array_elements_text()` in a `CROSS JOIN`.
- SQLite: `json_each(payload, '$.tags')` and its `value` column.
- DuckDB: cast the array to `VARCHAR[]` and `unnest` it.
- MySQL: `JSON_TABLE` with a `COLUMNS` clause that names the output column.

<!-- cook:sync -->

## The query

**PostgreSQL** (`query.sql`):

```sql
SELECT
    e.id,
    t.tag
FROM events AS e
CROSS JOIN jsonb_array_elements_text(CAST(e.payload AS jsonb) -> 'tags') AS t(tag)
ORDER BY e.id, t.tag
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    e.id,
    t.value AS tag
FROM events AS e
JOIN json_each(e.payload, '$.tags') AS t
ORDER BY e.id, tag
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    e.id,
    t.tag
FROM events AS e
JOIN JSON_TABLE(e.payload, '$.tags[*]' COLUMNS (tag VARCHAR(50) PATH '$')) AS t
ORDER BY e.id, t.tag
```

**DuckDB** (`query.duckdb.sql`):

```sql
SELECT
    e.id,
    unnest(CAST(e.payload -> '$.tags' AS VARCHAR[])) AS tag
FROM events AS e
ORDER BY e.id, tag
```

## The result

Starting from `setup.sql`, every engine returns:

| `id` | `tag` |
|---|---|
| 1 | login |
| 1 | web |
| 2 | purchase |
<!-- /cook:sync -->
