---
title: "Read a field out of JSON"
summary: "A top-level string and a nested number pulled out of a JSON column, as SQL values."
tags: [json]
ordered: true
related: [json-array-to-rows, build-json]
published: 2026-10-12
---

The payload is JSON stored as text. You want `user` as a string and `meta.age` as a number you can compare and sort. Every engine can do this; the operators differ, and so does whether you get quotes back.

## How it works

- The path `$.user` picks a top-level key; `$.meta.age` walks into the nested object.
- The `->>` operator (or `JSON_UNQUOTE`) returns text without the JSON quotes. `->` returns JSON, quotes included.
- The age is cast to an integer so that `ORDER BY age` sorts numerically.

## Differences

- PostgreSQL: cast the text to `json` or `jsonb` first, then `->` for a key and `->>` for its text.
- SQLite: `->>` with a `$.path` (3.38+), which also unquotes.
- DuckDB: `->>` with a `$.path` on JSON; a `VARCHAR` is cast to JSON on the way in.
- MySQL: `JSON_UNQUOTE(JSON_EXTRACT(col, '$.path'))`, or `col->>'$.path'` on a real `JSON` column.

<!-- cook:sync -->

## The query

**PostgreSQL** (`query.sql`):

```sql
SELECT
    id,
    CAST(payload AS jsonb) ->> 'user' AS user_name,
    CAST(CAST(payload AS jsonb) -> 'meta' ->> 'age' AS INTEGER) AS age
FROM events
ORDER BY id
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    id,
    payload ->> '$.user' AS user_name,
    CAST(payload ->> '$.meta.age' AS INTEGER) AS age
FROM events
ORDER BY id
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    id,
    JSON_UNQUOTE(JSON_EXTRACT(payload, '$.user')) AS user_name,
    CAST(JSON_EXTRACT(payload, '$.meta.age') AS SIGNED) AS age
FROM events
ORDER BY id
```

**DuckDB** (`query.duckdb.sql`):

```sql
SELECT
    id,
    payload ->> '$.user' AS user_name,
    CAST(payload ->> '$.meta.age' AS INTEGER) AS age
FROM events
ORDER BY id
```

## The result

Starting from `setup.sql`, every engine returns:

| `id` | `user_name` | `age` |
|---|---|---|
| 1 | ada | 36 |
| 2 | grace | 85 |
| 3 | linus | 54 |
<!-- /cook:sync -->
