---
title: "Percent of total"
summary: "Each category's share of revenue, with a window function over the aggregate."
tags: [group-by, window]
fixture: shop
ordered: true
related: [order-totals]
published: 2026-10-12
---

A share needs two numbers from different levels: the group's sum and the grand total. A window function over the aggregate gives you both in one query, with no second scan and no join to a subquery.

## How it works

- The inner `SUM(...)` is the ordinary aggregate: revenue per category.
- `SUM(SUM(...)) OVER ()` is a window function applied to that aggregate. With an empty `OVER ()`, its frame is every output row, so it's the grand total.
- Multiplying by `100.0` first keeps the division from being an integer division.

## Differences

- None: nesting an aggregate inside a window function is standard, and all four engines accept it. `ROUND(x, 1)` works everywhere here, although SQLite returns a float where the others return a decimal.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    p.category,
    SUM(oi.quantity * oi.unit_price) AS revenue,
    ROUND(100.0 * SUM(oi.quantity * oi.unit_price)
          / SUM(SUM(oi.quantity * oi.unit_price)) OVER (), 1) AS pct
FROM order_items AS oi
JOIN orders AS o ON o.id = oi.order_id
JOIN products AS p ON p.id = oi.product_id
WHERE o.status = 'paid'
GROUP BY p.category
ORDER BY revenue DESC
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `category` | `revenue` | `pct` |
|---|---|---|
| hardware | 613.5 | 80.6 |
| courses | 108 | 14.2 |
| merch | 39.92 | 5.2 |
<!-- /cook:sync -->
