---
title: "Page with OFFSET"
summary: "The second page of three orders, with LIMIT and OFFSET, and why it gets slow."
tags: [performance]
fixture: shop
ordered: true
related: [keyset-pagination]
published: 2026-10-12
---

Page 2, three per page: skip three rows, take three. It's the simplest pagination there is, and it's fine for the first few pages of a small table.

## How it works

- `ORDER BY` is not optional. Without it, pages can overlap or skip rows between requests.
- `OFFSET 3` throws away the first three rows; `LIMIT 3` keeps the next three.
- The engine still reads and sorts every skipped row, so page 1000 costs a thousand times more than page 1. For deep pages, see keyset pagination.

## Differences

- None: `LIMIT ... OFFSET ...` works on all four. PostgreSQL and DuckDB also accept the standard `OFFSET 3 ROWS FETCH NEXT 3 ROWS ONLY`.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT id, ordered_at
FROM orders
ORDER BY ordered_at, id
LIMIT 3 OFFSET 3
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `ordered_at` |
|---|---|
| 4 | 2024-03-03 08:00:00 |
| 5 | 2024-03-10 16:30:00 |
| 6 | 2024-03-15 12:00:00 |
<!-- /cook:sync -->
