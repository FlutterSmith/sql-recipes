---
title: "Rows in one set but not another"
summary: "Products Ada bought that Linus never did, with EXCEPT."
tags: [join, subquery]
fixture: shop
ordered: true
related: [rows-with-no-match, full-outer-join]
published: 2026-10-12
---

Two result sets, and you want what's in the first but not the second. `EXCEPT` does that in one line, and it treats `NULL`s as equal, which `NOT IN` doesn't.

## How it works

- Each `SELECT` lists the product ids one customer has ordered.
- `EXCEPT` removes every id that appears in the second set, and drops duplicates (`EXCEPT ALL` keeps them, where supported).
- The outer query swaps the surviving ids for names.

## Differences

- MySQL supports `EXCEPT` since 8.0.31. Before that, use `NOT EXISTS` as in rows-with-no-match.
- Oracle spells it `MINUS`; none of the engines here do.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT p.id, p.name
FROM products AS p
WHERE p.id IN (
    SELECT oi.product_id
    FROM order_items AS oi
    JOIN orders AS o ON o.id = oi.order_id
    WHERE o.customer_id = 1
    EXCEPT
    SELECT oi.product_id
    FROM order_items AS oi
    JOIN orders AS o ON o.id = oi.order_id
    WHERE o.customer_id = 3
)
ORDER BY p.id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `name` |
|---|---|
| 4 | SQL course |
| 6 | Sticker pack |
<!-- /cook:sync -->
