---
title: "Histogram buckets"
summary: "Count order totals in bands of 50, by rounding each total down to its band."
tags: [group-by, cte]
fixture: shop
ordered: true
related: [order-totals]
published: 2026-10-12
---

How are order values spread? Put each total into a band (0 to 49.99, 50 to 99.99, and so on) and count per band. The band is the total rounded down to a multiple of the width.

## How it works

- `FLOOR(total / 50) * 50` turns 83.95 into 50 and 164 into 150: the start of each band.
- Grouping by that value counts the orders per band.
- Empty bands don't appear. To show them, generate the bands and `LEFT JOIN` the counts.

## Differences

- None: `FLOOR` exists on all four. On SQLite it needs 3.35+ (the maths functions), which every current build has.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
WITH totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
)
SELECT
    FLOOR(total / 50) * 50 AS bucket_start,
    COUNT(*) AS orders
FROM totals
GROUP BY FLOOR(total / 50) * 50
ORDER BY bucket_start
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `bucket_start` | `orders` |
|---|---|
| 0 | 2 |
| 50 | 2 |
| 100 | 1 |
| 150 | 3 |
<!-- /cook:sync -->
