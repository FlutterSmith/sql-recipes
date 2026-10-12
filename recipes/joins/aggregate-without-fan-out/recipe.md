---
title: "Totals per customer without double counting"
summary: "Spend per customer, aggregating the detail table before joining so nothing is counted twice."
tags: [join, group-by, subquery]
fixture: shop
ordered: true
related: [order-totals, rows-with-no-match]
published: 2026-10-12
---

Join customers to orders to items and sum, and the numbers are right. Add one more table to the chain, say shipments, and every item is counted once per shipment. The fix is to aggregate first, then join the totals.

## How it works

- `order_totals` collapses the items to one total per order before anything else is joined.
- `customer_totals` collapses those to one total per customer.
- A `LEFT JOIN` from customers keeps Margaret, who has no orders; `COALESCE` turns her `NULL` into 0.

## Differences

- None: standard SQL.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
WITH order_totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
),
customer_totals AS (
    SELECT o.customer_id, SUM(t.total) AS spent
    FROM orders AS o
    JOIN order_totals AS t ON t.order_id = o.id
    GROUP BY o.customer_id
)
SELECT
    c.id,
    c.name,
    COALESCE(ct.spent, 0) AS spent
FROM customers AS c
LEFT JOIN customer_totals AS ct ON ct.customer_id = c.id
ORDER BY c.id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `name` | `spent` |
|---|---|---|
| 1 | Ada Lovelace | 267.92 |
| 2 | Grace Hopper | 213 |
| 3 | Linus Torvalds | 388.5 |
| 4 | Margaret Hamilton | 0 |
<!-- /cook:sync -->
