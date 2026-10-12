---
title: "Case-insensitive search"
summary: "Match text regardless of case, with LOWER(), ILIKE, or the engine's default collation."
tags: [text]
fixture: shop
ordered: true
published: 2026-10-12
---

A visitor types `hamilton` and you want to find `Margaret Hamilton`. The portable way is to lower-case both sides. Two engines have a shortcut, and two are case-insensitive to begin with.

## How it works

- `LOWER()` on both the column and the pattern makes the comparison case-blind on any engine.
- The `%` wildcards match anything before and after.
- Lower-casing the column defeats a plain index on it. For big tables, index `LOWER(name)` or use a case-insensitive collation.

## Differences

- PostgreSQL and DuckDB: `ILIKE` is a case-insensitive `LIKE`.
- SQLite: `LIKE` is already case-insensitive, but only for ASCII letters. `Ä` and `ä` don't match.
- MySQL: with the default `utf8mb4_0900_ai_ci` collation, `LIKE` and `=` ignore case and accents. The `_ci` in the name says so.

<!-- cook:sync -->

## The query

**SQLite, MySQL** (`query.sql`):

```sql
SELECT id, name
FROM customers
WHERE LOWER(name) LIKE LOWER('%hamilton%')
ORDER BY id
```

**PostgreSQL** (`query.postgres.sql`):

```sql
SELECT id, name
FROM customers
WHERE name ILIKE '%hamilton%'
ORDER BY id
```

**DuckDB** (`query.duckdb.sql`):

```sql
SELECT id, name
FROM customers
WHERE name ILIKE '%hamilton%'
ORDER BY id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `name` |
|---|---|
| 4 | Margaret Hamilton |
<!-- /cook:sync -->
