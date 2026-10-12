---
title: "Page with a keyset (seek method)"
summary: "The next page after a known row, with a row-value comparison that uses the index."
tags: [performance]
fixture: shop
ordered: true
related: [offset-pagination]
published: 2026-10-12
---

Instead of 'skip 3 rows', say 'rows after the last one I saw'. The database can jump straight to that point with an index, so page 1000 costs the same as page 1. The last row of the previous page here was order 3, placed at 11:05 on 20 February.

## How it works

- `(ordered_at, id) > ('2024-02-20 11:05:00', 3)` means: later than that timestamp, or the same timestamp with a higher id. That's the row-value comparison.
- `id` is in the sort key as a tie-breaker, so two orders at the same instant can't be skipped or repeated.
- The client remembers the last row's `ordered_at` and `id` and sends them back for the next page. There is no page number.

## Differences

- Row-value comparisons are standard and all four engines support them (SQLite since 3.15). Without them, write `ordered_at > ? OR (ordered_at = ? AND id > ?)`.
- DuckDB compares the row as a struct and won't cast a bare string inside it, so the literal is written `TIMESTAMP '...'`. PostgreSQL and MySQL accept that too. SQLite has no typed literals and compares the text directly.

<!-- cook:sync -->

## The query

**PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT id, ordered_at
FROM orders
WHERE (ordered_at, id) > (TIMESTAMP '2024-02-20 11:05:00', 3)
ORDER BY ordered_at, id
LIMIT 3
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT id, ordered_at
FROM orders
WHERE (ordered_at, id) > ('2024-02-20 11:05:00', 3)
ORDER BY ordered_at, id
LIMIT 3
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `ordered_at` |
|---|---|
| 4 | 2024-03-03 08:00:00 |
| 5 | 2024-03-10 16:30:00 |
| 6 | 2024-03-15 12:00:00 |
<!-- /cook:sync -->
