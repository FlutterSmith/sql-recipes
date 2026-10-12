---
title: "Count rows that meet a condition"
summary: "Count all orders and only the paid ones in one pass, with FILTER or CASE."
tags: [group-by, null]
fixture: shop
ordered: true
related: [pivot-with-case]
published: 2026-10-12
---

You want two counts per customer from a single scan: every order, and only the paid ones. Don't run two queries; make the second count conditional.

## How it works

- `COUNT(*)` counts every row in the group.
- `COUNT(*) FILTER (WHERE ...)` counts only the rows that pass the condition.
- `FILTER` works on any aggregate: `SUM(...) FILTER (WHERE ...)`, `AVG`, `MAX`.

## Differences

- MySQL has no `FILTER` clause. `SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` does the same job, and it also works on the other three engines if you prefer one spelling everywhere.
- SQLite needs 3.30+ for `FILTER`.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT
    customer_id,
    COUNT(*) AS orders,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_orders
FROM orders
GROUP BY customer_id
ORDER BY customer_id
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    customer_id,
    COUNT(*) AS orders,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_orders
FROM orders
GROUP BY customer_id
ORDER BY customer_id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `customer_id` | `orders` | `paid_orders` |
|---|---|---|
| 1 | 3 | 3 |
| 2 | 2 | 1 |
| 3 | 3 | 2 |
<!-- /cook:sync -->
