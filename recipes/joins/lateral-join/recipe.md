---
title: "Lateral join"
summary: "The two most recent orders of every customer, with a subquery that can see the outer row."
tags: [join, subquery]
fixture: shop
ordered: true
unsupported:
  sqlite: "SQLite has no LATERAL join. Use the window function in top-n-per-group."
related: [top-n-per-group, latest-row-per-group]
published: 2026-10-12
---

A `LATERAL` subquery runs once per row of the table before it, and it can use that row's columns. That makes 'the first two orders of this customer' a plain `ORDER BY ... LIMIT 2` instead of a window function.

## How it works

- `LEFT JOIN LATERAL (...) ON TRUE` runs the subquery for each customer. `LEFT` keeps customers with no orders.
- Inside, `WHERE o.customer_id = c.id` refers to the outer row, which a normal subquery in `FROM` can't do.
- `LIMIT 2` applies per customer, because the subquery runs per customer.

## Differences

- PostgreSQL, MySQL (8.0.14+) and DuckDB support `LATERAL`.
- SQLite has no lateral joins. Use the window-function version from top-n-per-group instead.

<!-- cook:sync -->

## The query

**PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    c.id,
    c.name,
    recent.order_id,
    recent.ordered_at
FROM customers AS c
LEFT JOIN LATERAL (
    SELECT o.id AS order_id, o.ordered_at
    FROM orders AS o
    WHERE o.customer_id = c.id
    ORDER BY o.ordered_at DESC
    LIMIT 2
) AS recent ON TRUE
ORDER BY c.id, recent.ordered_at DESC
```

**SQLite:** not supported. SQLite has no LATERAL join. Use the window function in top-n-per-group.

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `name` | `order_id` | `ordered_at` |
|---|---|---|---|
| 1 | Ada Lovelace | 7 | 2024-04-02 10:10:00 |
| 1 | Ada Lovelace | 2 | 2024-02-14 18:40:00 |
| 2 | Grace Hopper | 6 | 2024-03-15 12:00:00 |
| 2 | Grace Hopper | 3 | 2024-02-20 11:05:00 |
| 3 | Linus Torvalds | 8 | 2024-04-21 19:45:00 |
| 3 | Linus Torvalds | 5 | 2024-03-10 16:30:00 |
| 4 | Margaret Hamilton | *NULL* | *NULL* |
<!-- /cook:sync -->
