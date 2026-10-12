---
title: "Distinct values per group"
summary: "How many different products each customer has bought, with COUNT(DISTINCT ...)."
tags: [group-by, join]
fixture: shop
ordered: true
published: 2026-10-12
---

A customer who buys the same keyboard twice has bought one product, not two. `COUNT(DISTINCT ...)` counts each value once per group.

## How it works

- The join lines up every order item with its customer.
- `COUNT(DISTINCT oi.product_id)` counts the different products in each customer's group.
- `COUNT(oi.product_id)` would count line items instead.

## Differences

- None: standard SQL. For very large groups, PostgreSQL and DuckDB also offer approximate versions (`approx_count_distinct`) that use far less memory.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    o.customer_id,
    COUNT(DISTINCT oi.product_id) AS products
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
GROUP BY o.customer_id
ORDER BY o.customer_id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `customer_id` | `products` |
|---|---|
| 1 | 4 |
| 2 | 3 |
| 3 | 4 |
<!-- /cook:sync -->
