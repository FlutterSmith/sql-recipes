---
title: "Total per order"
summary: "Sum line items into an order total with a join and GROUP BY."
tags: [group-by, join]
fixture: shop
ordered: true
related: [percent-of-total, median]
published: 2026-10-12
---

Each order has several lines, each with a quantity and a unit price. The order total is the sum of quantity times price over its lines.

## How it works

- The join brings every line next to its order.
- `GROUP BY o.id` makes one output row per order; `SUM()` adds up that order's lines.
- Multiply inside the `SUM()`: `SUM(quantity) * SUM(unit_price)` would be wrong.

## Differences

- None: standard SQL. The total's type differs (DECIMAL on PostgreSQL and MySQL, REAL on SQLite), which only matters when you display it.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    o.id AS order_id,
    SUM(oi.quantity * oi.unit_price) AS total
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
GROUP BY o.id
ORDER BY o.id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `order_id` | `total` |
|---|---|
| 1 | 134.97 |
| 2 | 49 |
| 3 | 164 |
| 4 | 59 |
| 5 | 159.5 |
| 6 | 49 |
| 7 | 83.95 |
| 8 | 170 |
<!-- /cook:sync -->
