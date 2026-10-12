---
title: "Pivot rows into columns"
summary: "One column per order status, with SUM(CASE ...), or DuckDB's PIVOT."
tags: [group-by]
fixture: shop
ordered: true
related: [conditional-count]
published: 2026-10-12
---

A report wants customers as rows and statuses as columns. Standard SQL has no pivot, but a conditional sum per column does the job whenever you know the column names in advance.

## How it works

- Each `SUM(CASE ...)` counts the rows of one status: 1 for a match, 0 otherwise.
- `GROUP BY customer_id` makes one row per customer.
- Add a column for each new status by hand. If the set of statuses changes, this query must change too.

## Differences

- DuckDB has a `PIVOT` statement that discovers the column values itself.
- PostgreSQL has `crosstab()` in the `tablefunc` extension, which needs installing. The `CASE` version needs nothing.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL** (`query.sql`):

```sql
SELECT
    customer_id,
    SUM(CASE WHEN status = 'paid'      THEN 1 ELSE 0 END) AS paid,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
    SUM(CASE WHEN status = 'refunded'  THEN 1 ELSE 0 END) AS refunded
FROM orders
GROUP BY customer_id
ORDER BY customer_id
```

**DuckDB** (`query.duckdb.sql`):

```sql
PIVOT orders
ON status IN ('paid', 'cancelled', 'refunded')
USING COUNT(*)
GROUP BY customer_id
ORDER BY customer_id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `customer_id` | `paid` | `cancelled` | `refunded` |
|---|---|---|---|
| 1 | 3 | 0 | 0 |
| 2 | 1 | 0 | 1 |
| 3 | 2 | 1 | 0 |
<!-- /cook:sync -->
