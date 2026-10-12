---
title: "Join parts of a name, skipping NULLs"
summary: "Build a full name from parts that may be NULL, with CONCAT_WS."
tags: [text, null]
ordered: true
related: [string-aggregation]
published: 2026-10-12
---

`first || ' ' || middle || ' ' || last` is `NULL` for anyone without a middle name, because `NULL` swallows the whole expression. `CONCAT_WS` skips `NULL` parts and puts the separator only between the parts that exist.

## How it works

- `CONCAT_WS(separator, part, part, ...)`: the first argument is the separator.
- `NULL` parts are left out, and so is their separator, so there are never two spaces in a row.
- Empty strings are not `NULL`, and are kept. `NULLIF(middle, '')` turns them into `NULL` first if needed.

## Differences

- None: `CONCAT_WS` exists on all four (SQLite since 3.44). The `||` operator is the odd one out: on MySQL it means `OR` unless `PIPES_AS_CONCAT` is on.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    id,
    CONCAT_WS(' ', first, middle, last) AS full_name
FROM people
ORDER BY id
```

## The result

Starting from `setup.sql`, every engine returns:

| `id` | `full_name` |
|---|---|
| 1 | Ada Lovelace |
| 2 | Grace Brewster Hopper |
| 3 | Linus Torvalds |
<!-- /cook:sync -->
