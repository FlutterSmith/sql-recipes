---
title: "Median"
summary: "The median order total, with percentile_cont where it exists and a window trick where it doesn't."
tags: [window, cte]
fixture: shop
related: [order-totals]
published: 2026-10-12
---

There's no `MEDIAN()` in standard SQL, and `AVG` is pulled around by outliers. Two engines have a percentile function. The other two need the middle row (or the two middle rows) picked out by hand.

## How it works

- `totals` computes one total per order.
- `ROW_NUMBER()` sorts the totals and numbers them; `COUNT(*) OVER ()` is how many there are.
- The rows whose number is within `cnt / 2` and `cnt / 2 + 1` are the middle one (odd count) or the middle two (even count). `AVG` of them is the median.

## Differences

- PostgreSQL: `percentile_cont(0.5) WITHIN GROUP (ORDER BY total)`. Change 0.5 for any other percentile.
- DuckDB: `median(total)`, or `quantile_cont(total, 0.5)`.
- SQLite and MySQL: no percentile function, so the window version is the way. It also runs on the other two engines.

<!-- cook:sync -->

## The query

**SQLite, MySQL** (`query.sql`):

```sql
WITH totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
),
ranked AS (
    SELECT
        total,
        ROW_NUMBER() OVER (ORDER BY total) AS rn,
        COUNT(*) OVER () AS cnt
    FROM totals
)
SELECT AVG(total) AS median_total
FROM ranked
WHERE rn BETWEEN cnt / 2.0 AND cnt / 2.0 + 1
```

**PostgreSQL** (`query.postgres.sql`):

```sql
WITH totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
)
SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY total) AS median_total
FROM totals
```

**DuckDB** (`query.duckdb.sql`):

```sql
WITH totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
)
SELECT median(total) AS median_total
FROM totals
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `median_total` |
|---|
| 109.46 |
<!-- /cook:sync -->
