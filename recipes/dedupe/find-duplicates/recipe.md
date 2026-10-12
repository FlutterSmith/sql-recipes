---
title: "Find duplicate rows"
summary: "Values that appear more than once, and how many times, with GROUP BY and HAVING."
tags: [group-by, delete]
ordered: true
related: [delete-duplicates, upsert]
published: 2026-10-12
---

Before you add a unique constraint, find out what would violate it. Group by the column that should be unique and keep the groups with more than one row.

## How it works

- `GROUP BY email` makes one row per distinct email.
- `HAVING COUNT(*) > 1` keeps only the groups with duplicates. `WHERE` can't do this, because it runs before the grouping.
- `MIN(id)` shows the row you'd probably keep.

## Differences

- None: standard SQL.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    email,
    COUNT(*) AS copies,
    MIN(id) AS keep_id
FROM signups
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email
```

## The result

Starting from `setup.sql`, every engine returns:

| `email` | `copies` | `keep_id` |
|---|---|---|
| ada@example.com | 3 | 1 |
| bob@example.com | 2 | 2 |
<!-- /cook:sync -->
