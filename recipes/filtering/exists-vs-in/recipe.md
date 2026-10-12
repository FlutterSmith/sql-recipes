---
title: "Customers who bought from a category"
summary: "Rows that have at least one match two joins away, with EXISTS instead of a join that duplicates rows."
tags: [subquery, join]
fixture: shop
ordered: true
related: [rows-with-no-match]
published: 2026-10-12
---

Which customers have ever ordered a course? Joining customers to orders to items to products would return one row per matching item, so you'd need `DISTINCT`. `EXISTS` asks the question directly and never duplicates.

## How it works

- The subquery joins orders, order items and products, and is tied to the outer customer by `o.customer_id = c.id`.
- The engine stops at the first matching row for each customer.
- `IN (SELECT customer_id ...)` works too for a single column, as long as that column can't be `NULL`.

## Differences

- None: standard SQL.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT c.id, c.name
FROM customers AS c
WHERE EXISTS (
    SELECT 1
    FROM orders AS o
    JOIN order_items AS oi ON oi.order_id = o.id
    JOIN products AS p ON p.id = oi.product_id
    WHERE o.customer_id = c.id
      AND p.category = 'courses'
)
ORDER BY c.id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `name` |
|---|---|
| 1 | Ada Lovelace |
| 2 | Grace Hopper |
| 3 | Linus Torvalds |
<!-- /cook:sync -->
