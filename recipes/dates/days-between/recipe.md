---
title: "Days between two dates"
summary: "How many days passed between sign-up and first order, four different ways."
tags: [date, group-by]
fixture: shop
ordered: true
related: [rows-in-a-date-range, years-of-service]
published: 2026-10-12
---

Subtracting two dates sounds like the one thing every database agrees on. It isn't: one engine returns an integer, one an interval, one needs a function, and one wants Julian day numbers.

## How it works

- `MIN(o.ordered_at)` is each customer's first order.
- The difference between that and `created_at` is the number of whole days, with the time of day ignored.
- The join is an inner join, so customers with no orders aren't listed.

## Differences

- PostgreSQL: `date - date` is an integer number of days. Cast the timestamp to `DATE` first, or you get an interval.
- MySQL: `DATEDIFF(later, earlier)`. The argument order is the opposite of PostgreSQL's subtraction.
- SQLite: `julianday(later) - julianday(earlier)` is a float; cast it to an integer.
- DuckDB: `date_diff('day', earlier, later)`, or `date - date`, which also gives an integer.

<!-- cook:sync -->

## The query

**PostgreSQL** (`query.sql`):

```sql
SELECT
    c.name,
    CAST(MIN(o.ordered_at) AS DATE) - c.created_at AS days_to_first_order
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.name, c.created_at
ORDER BY c.id
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    c.name,
    CAST(julianday(MIN(o.ordered_at)) - julianday(c.created_at) AS INTEGER)
        AS days_to_first_order
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.name, c.created_at
ORDER BY c.id
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    c.name,
    DATEDIFF(MIN(o.ordered_at), c.created_at) AS days_to_first_order
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.name, c.created_at
ORDER BY c.id
```

**DuckDB** (`query.duckdb.sql`):

```sql
SELECT
    c.name,
    date_diff('day', c.created_at, CAST(MIN(o.ordered_at) AS DATE)) AS days_to_first_order
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.name, c.created_at
ORDER BY c.id
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `name` | `days_to_first_order` |
|---|---|
| Ada Lovelace | 27 |
| Grace Hopper | 31 |
| Linus Torvalds | 21 |
<!-- /cook:sync -->
