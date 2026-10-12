---
title: "Day of the week"
summary: "Orders per weekday, numbered Monday = 1 to Sunday = 7, on engines that each count differently."
tags: [date, group-by]
fixture: shop
ordered: true
related: [truncate-to-month]
published: 2026-10-12
---

Ask four databases what day of the week a date is and you get three numbering schemes. This recipe normalises all of them to ISO: Monday is 1, Sunday is 7.

## How it works

- Each engine's weekday expression is rewritten to the ISO number.
- Grouping by that number counts the orders per weekday.
- Weekdays with no orders don't appear; join a seven-row table to show zeros.

## Differences

- PostgreSQL: `EXTRACT(ISODOW FROM ts)` is already ISO. `EXTRACT(DOW ...)` is 0 = Sunday.
- DuckDB: `isodow(ts)`. `dayofweek(ts)` is 0 = Sunday.
- MySQL: `WEEKDAY(ts)` is 0 = Monday, so add 1. `DAYOFWEEK(ts)` is 1 = Sunday.
- SQLite: `strftime('%w', ts)` is 0 = Sunday, so shift and wrap: `(w + 6) % 7 + 1`.

<!-- cook:sync -->

## The query

**PostgreSQL** (`query.sql`):

```sql
SELECT
    CAST(EXTRACT(ISODOW FROM ordered_at) AS INTEGER) AS weekday,
    COUNT(*) AS orders
FROM orders
GROUP BY CAST(EXTRACT(ISODOW FROM ordered_at) AS INTEGER)
ORDER BY weekday
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    (strftime('%w', ordered_at) + 6) % 7 + 1 AS weekday,
    COUNT(*) AS orders
FROM orders
GROUP BY (strftime('%w', ordered_at) + 6) % 7 + 1
ORDER BY weekday
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    WEEKDAY(ordered_at) + 1 AS weekday,
    COUNT(*) AS orders
FROM orders
GROUP BY WEEKDAY(ordered_at) + 1
ORDER BY weekday
```

**DuckDB** (`query.duckdb.sql`):

```sql
SELECT
    isodow(ordered_at) AS weekday,
    COUNT(*) AS orders
FROM orders
GROUP BY isodow(ordered_at)
ORDER BY weekday
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `weekday` | `orders` |
|---|---|
| 2 | 2 |
| 3 | 1 |
| 4 | 1 |
| 5 | 1 |
| 7 | 3 |
<!-- /cook:sync -->
