---
title: "Group by month"
summary: "Revenue per calendar month, with date_trunc, DATE_FORMAT or strftime."
tags: [date, group-by]
fixture: shop
ordered: true
related: [rows-in-a-date-range, day-of-week]
published: 2026-10-12
---

Monthly revenue needs every timestamp rounded down to the first of its month, so that all of February's orders share one group key. Each engine has its own function for this.

## How it works

- The month expression turns `2024-02-14 18:40:00` into `2024-02-01`.
- Grouping by that expression gives one row per month; the join and the sum do the rest.
- Group by the truncated value, not by a formatted string, when you can: a real date sorts and compares correctly.

## Differences

- PostgreSQL and DuckDB: `date_trunc('month', ordered_at)`, cast to `DATE` to drop the time part.
- MySQL: `DATE_FORMAT(ordered_at, '%Y-%m-01')` returns a string. `DATE(DATE_FORMAT(...))` makes it a date again.
- SQLite: `strftime('%Y-%m-01', ordered_at)`. Dates are text in SQLite, so a string is as good as it gets.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT
    CAST(date_trunc('month', o.ordered_at) AS DATE) AS month,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
WHERE o.status = 'paid'
GROUP BY CAST(date_trunc('month', o.ordered_at) AS DATE)
ORDER BY month
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    strftime('%Y-%m-01', o.ordered_at) AS month,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
WHERE o.status = 'paid'
GROUP BY strftime('%Y-%m-01', o.ordered_at)
ORDER BY month
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    DATE(DATE_FORMAT(o.ordered_at, '%Y-%m-01')) AS month,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
WHERE o.status = 'paid'
GROUP BY DATE(DATE_FORMAT(o.ordered_at, '%Y-%m-01'))
ORDER BY month
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `month` | `orders` | `revenue` |
|---|---|---|
| 2024-02-01 | 3 | 347.97 |
| 2024-03-01 | 1 | 159.5 |
| 2024-04-01 | 2 | 253.95 |
<!-- /cook:sync -->
