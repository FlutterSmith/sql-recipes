---
title: "Full outer join"
summary: "Rows from both tables, matched where possible, with FULL OUTER JOIN or a UNION of two outer joins."
tags: [join, null]
ordered: true
related: [rows-with-no-match, set-difference]
published: 2026-10-12
---

Compare last year's stock with this year's: products that disappeared, products that are new, and products in both. A full outer join keeps every row from both sides.

## How it works

- `FULL OUTER JOIN` returns matched pairs, plus unmatched rows from the left with `NULL`s on the right, plus unmatched rows from the right with `NULL`s on the left.
- `COALESCE(a.sku, b.sku)` picks the key from whichever side has it.
- Filter on the joined columns in `WHERE` only after the join; a condition on one side in `WHERE` turns it back into a left or right join.

## Differences

- MySQL has no `FULL OUTER JOIN`. Combine a `LEFT JOIN` with the unmatched rows of a `RIGHT JOIN` using `UNION ALL`.
- SQLite supports it since 3.39 (2022).

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT
    COALESCE(a.sku, b.sku) AS sku,
    a.qty AS qty_2023,
    b.qty AS qty_2024
FROM stock_2023 AS a
FULL OUTER JOIN stock_2024 AS b ON b.sku = a.sku
ORDER BY sku
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT a.sku, a.qty AS qty_2023, b.qty AS qty_2024
FROM stock_2023 AS a
LEFT JOIN stock_2024 AS b ON b.sku = a.sku
UNION ALL
SELECT b.sku, NULL, b.qty
FROM stock_2024 AS b
LEFT JOIN stock_2023 AS a ON a.sku = b.sku
WHERE a.sku IS NULL
ORDER BY sku
```

## The result

Starting from `setup.sql`, every engine returns:

| `sku` | `qty_2023` | `qty_2024` |
|---|---|---|
| A | 10 | *NULL* |
| B | 5 | 7 |
| C | 2 | 0 |
| D | *NULL* | 4 |
<!-- /cook:sync -->
