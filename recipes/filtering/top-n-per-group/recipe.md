---
title: "Top N per group"
summary: "The two most expensive products in each category, with a window function."
tags: [window, ranking, cte]
fixture: shop
ordered: true
related: [latest-row-per-group]
published: 2026-10-12
---

Top-N-per-group is the same trick as latest-row-per-group with `rn <= N` instead of `rn = 1`. Here: the two priciest products in every category.

## How it works

- `ROW_NUMBER()` ranks products inside each category, most expensive first. `name` is the tie-breaker so the result is stable.
- `rn <= 2` keeps the top two. Use `DENSE_RANK()` instead when ties should all make the cut.
- A category with fewer than two products returns what it has. The alias is `place` because `rank` is a reserved word on MySQL.

## Differences

- None: this is standard SQL on all four engines.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
WITH ranked AS (
    SELECT
        category,
        name,
        price,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC, name) AS rn
    FROM products
)
SELECT category, name, price, rn AS place
FROM ranked
WHERE rn <= 2
ORDER BY category, rn
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `category` | `name` | `price` | `place` |
|---|---|---|---|
| courses | Python course | 59 | 1 |
| courses | SQL course | 49 | 2 |
| hardware | Mechanical keyboard | 120 | 1 |
| hardware | Monitor arm | 85 | 2 |
| merch | Sticker pack | 4.99 | 1 |
<!-- /cook:sync -->
