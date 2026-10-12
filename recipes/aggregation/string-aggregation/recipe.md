---
title: "Join values into one string per group"
summary: "The product names of each order as one comma-separated string, in alphabetical order."
tags: [group-by, text]
fixture: shop
ordered: true
related: [split-string-into-rows]
published: 2026-10-12
---

Instead of one row per line item, you want one row per order with the product names in a single column. Every engine has a string aggregate; the names and the way you order the pieces differ.

## How it works

- The join brings product names next to their order.
- The string aggregate glues the names of one group together with `', '` between them.
- The `ORDER BY` inside the aggregate controls the order of the pieces. Without it, the order is whatever the engine happens to produce.

## Differences

- PostgreSQL and DuckDB: `string_agg(value, separator ORDER BY ...)`.
- MySQL: `GROUP_CONCAT(value ORDER BY ... SEPARATOR ', ')`. The result is cut at `group_concat_max_len` (1024 bytes by default).
- SQLite: `group_concat(value, separator)`. The `ORDER BY` inside it needs SQLite 3.44+; before that, sort in a subquery and hope.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT
    oi.order_id,
    string_agg(p.name, ', ' ORDER BY p.name) AS products
FROM order_items AS oi
JOIN products AS p ON p.id = oi.product_id
GROUP BY oi.order_id
ORDER BY oi.order_id
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    oi.order_id,
    group_concat(p.name, ', ' ORDER BY p.name) AS products
FROM order_items AS oi
JOIN products AS p ON p.id = oi.product_id
GROUP BY oi.order_id
ORDER BY oi.order_id
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    oi.order_id,
    GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') AS products
FROM order_items AS oi
JOIN products AS p ON p.id = oi.product_id
GROUP BY oi.order_id
ORDER BY oi.order_id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `order_id` | `products` |
|---|---|
| 1 | Mechanical keyboard, Sticker pack |
| 2 | SQL course |
| 3 | Monitor arm, USB-C hub |
| 4 | Python course |
| 5 | Mechanical keyboard, USB-C hub |
| 6 | SQL course |
| 7 | Python course, Sticker pack |
| 8 | Monitor arm |
<!-- /cook:sync -->
