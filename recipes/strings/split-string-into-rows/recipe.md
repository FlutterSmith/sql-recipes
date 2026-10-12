---
title: "Split a string into rows"
summary: "A comma-separated column turned into one row per value, with unnest or a JSON detour."
tags: [text, json]
ordered: true
related: [string-aggregation, json-array-to-rows]
published: 2026-10-12
---

Someone stored tags as `sql,postgres` in one column. To count or join on them you need one row per tag. Two engines split strings into arrays and unnest them; the other two go through JSON.

## How it works

- `string_to_array` splits on the comma; `unnest` turns the array into rows next to the post's id.
- Each post contributes as many rows as it has tags.
- On MySQL and SQLite the string is wrapped in quotes and brackets to make a JSON array, which both engines can turn into rows.

## Differences

- PostgreSQL: `unnest(string_to_array(tags, ','))`.
- DuckDB: `unnest(string_split(tags, ','))`.
- SQLite: `json_each()` on the string rebuilt as a JSON array.
- MySQL: `JSON_TABLE()` on the same JSON array. There's no `SPLIT` function.

<!-- cook:sync -->

## The query

**PostgreSQL** (`query.sql`):

```sql
SELECT
    p.id,
    t.tag
FROM posts AS p
CROSS JOIN unnest(string_to_array(p.tags, ',')) AS t(tag)
ORDER BY p.id, t.tag
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    p.id,
    t.value AS tag
FROM posts AS p
JOIN json_each('["' || replace(p.tags, ',', '","') || '"]') AS t
ORDER BY p.id, tag
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    p.id,
    t.tag
FROM posts AS p
JOIN JSON_TABLE(
    CONCAT('["', REPLACE(p.tags, ',', '","'), '"]'),
    '$[*]' COLUMNS (tag VARCHAR(50) PATH '$')
) AS t
ORDER BY p.id, t.tag
```

**DuckDB** (`query.duckdb.sql`):

```sql
SELECT
    p.id,
    unnest(string_split(p.tags, ',')) AS tag
FROM posts AS p
ORDER BY p.id, tag
```

## The result

Starting from `setup.sql`, every engine returns:

| `id` | `tag` |
|---|---|
| 1 | postgres |
| 1 | sql |
| 2 | python |
| 3 | duckdb |
| 3 | sql |
| 3 | wasm |
<!-- /cook:sync -->
