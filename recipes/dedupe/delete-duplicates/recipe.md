---
title: "Delete duplicates, keep one"
summary: "Remove every copy but the one with the lowest id, with a self-join DELETE or NOT IN."
tags: [delete, subquery]
ordered: true
related: [find-duplicates, upsert]
published: 2026-10-12
---

Three rows for `ada@example.com`, and the unique index you want to add refuses to build. Delete the extra copies and keep the earliest row of each email.

## How it works

- The portable form keeps the rows whose id is the minimum of their email group, and deletes the rest.
- The inner `SELECT MIN(id) ... GROUP BY email` is wrapped in a derived table because MySQL won't read from the table it is deleting from.
- The `SELECT` at the end is only there to show what's left.

## Differences

- PostgreSQL and DuckDB: `DELETE ... USING` joins the table to itself and deletes the row whose twin has a smaller id. No subquery.
- MySQL: the same idea as a multi-table delete, `DELETE s FROM signups AS s JOIN signups AS keep ...`.
- SQLite: no join in `DELETE`, so the `NOT IN` form is the one to use.

<!-- cook:sync -->

## The query

**SQLite** (`query.sql`):

```sql
DELETE FROM signups
WHERE id NOT IN (
    SELECT keep_id
    FROM (SELECT MIN(id) AS keep_id FROM signups GROUP BY email) AS keep
);

SELECT id, email
FROM signups
ORDER BY id
```

**PostgreSQL** (`query.postgres.sql`):

```sql
DELETE FROM signups AS s
USING signups AS keep
WHERE keep.email = s.email
  AND keep.id < s.id;

SELECT id, email
FROM signups
ORDER BY id
```

**MySQL** (`query.mysql.sql`):

```sql
DELETE s
FROM signups AS s
JOIN signups AS keep
  ON keep.email = s.email
 AND keep.id < s.id;

SELECT id, email
FROM signups
ORDER BY id
```

**DuckDB** (`query.duckdb.sql`):

```sql
DELETE FROM signups AS s
USING signups AS keep
WHERE keep.email = s.email
  AND keep.id < s.id;

SELECT id, email
FROM signups
ORDER BY id
```

## The result

Starting from `setup.sql`, every engine returns:

| `id` | `email` |
|---|---|
| 1 | ada@example.com |
| 2 | bob@example.com |
| 4 | cy@example.com |
<!-- /cook:sync -->
