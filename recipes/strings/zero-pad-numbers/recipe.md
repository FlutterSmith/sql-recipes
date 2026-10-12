---
title: "Zero-pad a number"
summary: "Invoice numbers like INV-00042, with LPAD or printf."
tags: [text]
fixture: shop
ordered: true
published: 2026-10-12
---

Ids sort wrongly as text (`10` before `2`) and look wrong on an invoice. Padding them to a fixed width with zeros fixes both.

## How it works

- `LPAD(text, 5, '0')` adds zeros on the left until the string is five characters long.
- The id has to be text first; PostgreSQL and DuckDB won't pad a number.
- `CONCAT` prepends the prefix. A number longer than the width is not truncated by `printf`, but it is by `LPAD`.

## Differences

- PostgreSQL, MySQL and DuckDB: `LPAD`. MySQL casts the number to text itself.
- SQLite: no `LPAD`. `printf('INV-%05d', id)` does both the padding and the prefix in one call.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT
    id,
    CONCAT('INV-', LPAD(CAST(id AS VARCHAR(10)), 5, '0')) AS invoice_no
FROM orders
ORDER BY id
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    id,
    printf('INV-%05d', id) AS invoice_no
FROM orders
ORDER BY id
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    id,
    CONCAT('INV-', LPAD(id, 5, '0')) AS invoice_no
FROM orders
ORDER BY id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `id` | `invoice_no` |
|---|---|
| 1 | INV-00001 |
| 2 | INV-00002 |
| 3 | INV-00003 |
| 4 | INV-00004 |
| 5 | INV-00005 |
| 6 | INV-00006 |
| 7 | INV-00007 |
| 8 | INV-00008 |
<!-- /cook:sync -->
