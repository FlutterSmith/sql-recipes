---
title: "Customers with no orders"
summary: "Rows in one table with no related row in another, with NOT EXISTS (an anti join)."
tags: [subquery, join, null]
fixture: shop
ordered: true
related: [exists-vs-in]
published: 2026-10-12
---

Who signed up but never ordered? You want the customers for which no order exists. `NOT EXISTS` says exactly that.

## How it works

- The subquery is correlated: it refers to `c.id` from the outer query, and the engine checks it per customer.
- `SELECT 1` is a convention. `EXISTS` only cares whether a row comes back, never what's in it.
- A `LEFT JOIN ... WHERE o.id IS NULL` gives the same result, but `NOT IN (SELECT customer_id ...)` doesn't: one `NULL` in the list makes it return nothing.

## Differences

- None: `NOT EXISTS` is standard SQL and every planner here turns it into an anti join.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT c.id, c.name
FROM customers AS c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders AS o
    WHERE o.customer_id = c.id
)
ORDER BY c.id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `name` |
|---|---|
| 4 | Margaret Hamilton |
<!-- /cook:sync -->
