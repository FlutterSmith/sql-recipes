---
title: "Whole years between two dates"
summary: "Completed years of service as of a given date, counting birthdays, not year boundaries."
tags: [date]
fixture: hr
ordered: true
related: [days-between]
published: 2026-10-12
---

Someone hired on 28 August 2023 has worked zero full years on 30 June 2024, even though the year number went up. Counting year boundaries gets this wrong; counting anniversaries gets it right.

## How it works

- The anniversary count is the difference in years, minus one if this year's anniversary hasn't come yet.
- `age()` on PostgreSQL and DuckDB does that arithmetic and returns an interval; `EXTRACT(YEAR ...)` reads the years out of it.
- The reference date is fixed in the query so the result is the same every day. Use `CURRENT_DATE` in real code.

## Differences

- PostgreSQL and DuckDB: `age(later, earlier)` then extract the year.
- MySQL: `TIMESTAMPDIFF(YEAR, earlier, later)` counts completed years, which is what you want. `YEAR(a) - YEAR(b)` doesn't.
- SQLite: no interval type. Subtract the year numbers, then subtract one more when the month-day of the later date is before the anniversary.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT
    name,
    CAST(EXTRACT(YEAR FROM age(DATE '2024-06-30', hired_on)) AS INTEGER) AS years
FROM employees
ORDER BY id
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    name,
    (strftime('%Y', '2024-06-30') - strftime('%Y', hired_on))
      - (strftime('%m-%d', '2024-06-30') < strftime('%m-%d', hired_on)) AS years
FROM employees
ORDER BY id
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    name,
    TIMESTAMPDIFF(YEAR, hired_on, DATE '2024-06-30') AS years
FROM employees
ORDER BY id
```

## The result

Starting from the [`hr` fixture](../../_fixtures/hr.sql), every engine returns:

| `name` | `years` |
|---|---|
| Nadia | 5 |
| Omar | 4 |
| Priya | 3 |
| Quentin | 1 |
| Rosa | 4 |
| Sam | 2 |
| Tariq | 1 |
| Uma | 2 |
| Viktor | 0 |
<!-- /cook:sync -->
