---
title: "Running total"
summary: "Cumulative revenue over time, with SUM() OVER (ORDER BY ...)."
tags: [window, cte]
fixture: shop
ordered: true
related: [moving-average, order-totals]
published: 2026-10-12
---

A running total adds each order to everything that came before it. Before window functions this took a self-join that grew quadratically. Now it's one `SUM` with an `OVER` clause.

## How it works

- `totals` makes one row per paid order with its date and amount.
- `SUM(total) OVER (ORDER BY ordered_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` adds the current row to all earlier rows.
- Spell the frame out. The default frame is `RANGE`, which lumps rows with equal `ordered_at` together, and that's rarely what you want for a running total.

## Differences

- None: standard SQL, supported since SQLite 3.25 and MySQL 8.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
WITH totals AS (
    SELECT
        o.id AS order_id,
        o.ordered_at,
        SUM(oi.quantity * oi.unit_price) AS total
    FROM orders AS o
    JOIN order_items AS oi ON oi.order_id = o.id
    WHERE o.status = 'paid'
    GROUP BY o.id, o.ordered_at
)
SELECT
    order_id,
    ordered_at,
    total,
    SUM(total) OVER (
        ORDER BY ordered_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM totals
ORDER BY ordered_at
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `order_id` | `ordered_at` | `total` | `running_total` |
|---|---|---|---|
| 1 | 2024-02-01 09:15:00 | 134.97 | 134.97 |
| 2 | 2024-02-14 18:40:00 | 49 | 183.97 |
| 3 | 2024-02-20 11:05:00 | 164 | 347.97 |
| 5 | 2024-03-10 16:30:00 | 159.5 | 507.47 |
| 7 | 2024-04-02 10:10:00 | 83.95 | 591.42 |
| 8 | 2024-04-21 19:45:00 | 170 | 761.42 |
<!-- /cook:sync -->
