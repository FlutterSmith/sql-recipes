---
title: "Update from another table"
summary: "Apply a table of price changes to the products table, with UPDATE ... FROM or an UPDATE join."
tags: [join, upsert]
fixture: shop
ordered: true
related: [upsert]
published: 2026-10-12
---

A spreadsheet of new prices lands in a `price_updates` table. You want one statement that writes each new price onto its product, without a loop in application code.

## How it works

- `UPDATE products SET price = u.new_price FROM price_updates AS u WHERE u.product_id = products.id` joins the two tables and copies the value.
- Only products with a row in `price_updates` change; the rest keep their price.
- The `SELECT` afterwards shows the result.

## Differences

- PostgreSQL, SQLite (3.33+) and DuckDB share the `UPDATE ... FROM` syntax.
- MySQL spells the join first: `UPDATE products AS p JOIN price_updates AS u ON ... SET p.price = u.new_price`.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, DuckDB** (`query.sql`):

```sql
UPDATE products
SET price = u.new_price
FROM price_updates AS u
WHERE u.product_id = products.id;

SELECT id, name, price
FROM products
ORDER BY id
```

**MySQL** (`query.mysql.sql`):

```sql
UPDATE products AS p
JOIN price_updates AS u ON u.product_id = p.id
SET p.price = u.new_price;

SELECT id, name, price
FROM products
ORDER BY id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql) and `setup.sql`, every engine returns:

| `id` | `name` | `price` |
|---|---|---|
| 1 | Mechanical keyboard | 120 |
| 2 | USB-C hub | 35 |
| 3 | Monitor arm | 85 |
| 4 | SQL course | 49 |
| 5 | Python course | 59 |
| 6 | Sticker pack | 5.49 |
<!-- /cook:sync -->
