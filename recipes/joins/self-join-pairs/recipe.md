---
title: "Pairs within a group"
summary: "Every pair of products in the same category, listed once, with a self-join."
tags: [join]
fixture: shop
ordered: true
published: 2026-10-12
---

Which products could be bundled together? Joining a table to itself pairs every row with every other row in its group. The `<` keeps each pair once and leaves out a product paired with itself.

## How it works

- Both sides of the join are `products`, under different aliases.
- `a.category = b.category` keeps pairs inside a category.
- `a.id < b.id` lists (keyboard, hub) but not (hub, keyboard), and never (keyboard, keyboard). A category with one product yields nothing.

## Differences

- None: standard SQL.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    a.category,
    a.name AS first,
    b.name AS second
FROM products AS a
JOIN products AS b
  ON b.category = a.category
 AND b.id > a.id
ORDER BY a.category, a.id, b.id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `category` | `first` | `second` |
|---|---|---|
| courses | SQL course | Python course |
| hardware | Mechanical keyboard | USB-C hub |
| hardware | Mechanical keyboard | Monitor arm |
| hardware | USB-C hub | Monitor arm |
<!-- /cook:sync -->
