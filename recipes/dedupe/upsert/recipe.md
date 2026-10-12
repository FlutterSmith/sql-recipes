---
title: "Insert or update (upsert)"
summary: "Insert a row, or add to it when the key already exists, with ON CONFLICT or ON DUPLICATE KEY."
tags: [upsert]
ordered: true
related: [insert-if-not-exists, update-from-another-table]
published: 2026-10-12
---

A delivery arrives: 3 more of `A`, which is in stock, and 7 of `C`, which isn't. One statement should update the first and insert the second, without a read-then-write race.

## How it works

- `INSERT ... VALUES` tries to insert both rows.
- `ON CONFLICT (sku) DO UPDATE` runs instead of failing when the primary key already exists. `excluded` is the row that would have been inserted.
- `stock.qty + excluded.qty` adds the delivery to what's there. To overwrite instead, use `qty = excluded.qty`.

## Differences

- PostgreSQL, SQLite (3.24+) and DuckDB share the `ON CONFLICT` syntax.
- MySQL: `ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`. MySQL 8.0.20 deprecates `VALUES()` in favour of a row alias: `INSERT ... AS new ON DUPLICATE KEY UPDATE qty = qty + new.qty`.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, DuckDB** (`query.sql`):

```sql
INSERT INTO stock (sku, qty)
VALUES ('A', 3), ('C', 7)
ON CONFLICT (sku) DO UPDATE
SET qty = stock.qty + excluded.qty;

SELECT sku, qty
FROM stock
ORDER BY sku
```

**MySQL** (`query.mysql.sql`):

```sql
INSERT INTO stock (sku, qty)
VALUES ('A', 3), ('C', 7)
ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty);

SELECT sku, qty
FROM stock
ORDER BY sku
```

## The result

Starting from `setup.sql`, every engine returns:

| `sku` | `qty` |
|---|---|
| A | 13 |
| B | 5 |
| C | 7 |
<!-- /cook:sync -->
