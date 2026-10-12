---
title: "Rows in a date range"
summary: "Orders placed in March, with a half-open range instead of BETWEEN."
tags: [date]
fixture: shop
ordered: true
related: [truncate-to-month]
published: 2026-10-12
---

`BETWEEN '2024-03-01' AND '2024-03-31'` looks right and silently misses everything on 31 March after midnight, because `'2024-03-31'` means the first instant of that day. Use a half-open range: on or after the first day, before the first day of the next month.

## How it works

- `>=` includes the start of the range.
- `<` excludes the start of the next range, so a timestamp at 23:59:59 on the last day still counts.
- The same shape works for days, weeks and years, and it lets the engine use an index on `ordered_at`.

## Differences

- None. Each engine compares the timestamp column with the string literal in its own way, and all four get it right. SQLite compares text, so keep timestamps in `YYYY-MM-DD HH:MM:SS` form.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT id, ordered_at
FROM orders
WHERE ordered_at >= '2024-03-01'
  AND ordered_at <  '2024-04-01'
ORDER BY ordered_at
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `ordered_at` |
|---|---|
| 4 | 2024-03-03 08:00:00 |
| 5 | 2024-03-10 16:30:00 |
| 6 | 2024-03-15 12:00:00 |
<!-- /cook:sync -->
