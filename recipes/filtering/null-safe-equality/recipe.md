---
title: "Compare values that may be NULL"
summary: "Treat two NULLs as equal, with IS NOT DISTINCT FROM, IS, or <=>, depending on the engine."
tags: [nulls, join]
ordered: true
published: 2026-10-12
---

`NULL = NULL` is not true, so a join on a nullable column silently drops the rows where both sides are `NULL`. Every engine has a null-safe comparison, each with its own spelling.

## How it works

- The self-join pairs up profiles with the same nickname, including the pair whose nicknames are both missing.
- `a.id < b.id` lists each pair once.
- Without the null-safe operator, the pair (2, 4) disappears.

## Differences

- PostgreSQL and DuckDB: `IS NOT DISTINCT FROM`, the standard spelling.
- SQLite: `IS` compares like `=` but treats two `NULL`s as equal. `IS NOT` is its negation.
- MySQL: `<=>`, the null-safe equal operator. Negate with `NOT (a <=> b)`.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT a.id AS first_id, b.id AS second_id
FROM profiles AS a
JOIN profiles AS b
  ON a.nickname IS NOT DISTINCT FROM b.nickname
 AND a.id < b.id
ORDER BY a.id, b.id
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT a.id AS first_id, b.id AS second_id
FROM profiles AS a
JOIN profiles AS b
  ON a.nickname IS b.nickname
 AND a.id < b.id
ORDER BY a.id, b.id
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT a.id AS first_id, b.id AS second_id
FROM profiles AS a
JOIN profiles AS b
  ON a.nickname <=> b.nickname
 AND a.id < b.id
ORDER BY a.id, b.id
```

## The result

Starting from `setup.sql`, every engine returns:

| `first_id` | `second_id` |
|---|---|
| 1 | 3 |
| 2 | 4 |
<!-- /cook:sync -->
