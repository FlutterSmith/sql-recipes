---
title: "Latest order per customer"
summary: "For each customer, the single most recent order, with a window function or DISTINCT ON."
tags: [window, cte]
fixture: shop
ordered: true
related: [top-n-per-group]
published: 2026-10-12
---

Each customer has several orders and you want one row per customer: the newest. This is the classic top-1-per-group question, and the answer is a window function.

## How it works

- `ROW_NUMBER()` numbers each customer's orders from newest to oldest, restarting at 1 for every `customer_id`.
- The outer query keeps the rows numbered 1.
- Put the ranking in a CTE or subquery: a window function can't go in `WHERE` directly.

## Differences

- PostgreSQL has `DISTINCT ON (customer_id)`, which keeps the first row per customer in `ORDER BY` order. It's shorter and usually faster.
- The shared query needs SQLite 3.25+ and MySQL 8+, the versions that added window functions.

<!-- cook:sync -->

## The query

**SQLite, MySQL, DuckDB** (`query.sql`):

```sql
WITH ranked AS (
    SELECT
        customer_id,
        id AS order_id,
        ordered_at,
        status,
        ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at DESC) AS rn
    FROM orders
)
SELECT customer_id, order_id, ordered_at, status
FROM ranked
WHERE rn = 1
ORDER BY customer_id
```

**PostgreSQL** (`query.postgres.sql`):

```sql
SELECT DISTINCT ON (customer_id)
    customer_id,
    id AS order_id,
    ordered_at,
    status
FROM orders
ORDER BY customer_id, ordered_at DESC
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `customer_id` | `order_id` | `ordered_at` | `status` |
|---|---|---|---|
| 1 | 7 | 2024-04-02 10:10:00 | paid |
| 2 | 6 | 2024-03-15 12:00:00 | refunded |
| 3 | 8 | 2024-04-21 19:45:00 | paid |
<!-- /cook:sync -->
