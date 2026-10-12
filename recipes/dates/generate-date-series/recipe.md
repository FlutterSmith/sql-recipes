---
title: "Fill missing dates"
summary: "One row per calendar day, with the reading or NULL, from a generated series of dates."
tags: [date, cte, join, null]
fixture: sensors
ordered: true
related: [gaps-and-islands, number-series]
published: 2026-10-12
---

Sensor `a` has no readings on the 6th and 7th. A chart wants those days as gaps, not as a line that skips ahead. Generate every day in the range, then left-join the readings onto it.

## How it works

- `days` is a table of every date from the 1st to the 9th, built by the engine rather than stored.
- `LEFT JOIN` keeps the days with no reading; their `value` is `NULL`.
- The join compares the reading's date, not its timestamp, so a reading at any time of day lands on its day.

## Differences

- PostgreSQL: `generate_series(start, end, interval '1 day')`, which returns timestamps; cast to `DATE`.
- DuckDB: `generate_series` as a table function too, or `range()`.
- MySQL and SQLite: no series function, so a recursive CTE counts the days up. SQLite adds days with `date(day, '+1 day')`, MySQL with `+ INTERVAL 1 DAY`.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
WITH days AS (
    SELECT CAST(d AS DATE) AS day
    FROM generate_series(DATE '2024-01-01', DATE '2024-01-09', INTERVAL '1 day') AS g(d)
)
SELECT
    days.day,
    r.value
FROM days
LEFT JOIN readings AS r
       ON CAST(r.read_at AS DATE) = days.day
      AND r.sensor = 'a'
ORDER BY days.day
```

**SQLite** (`query.sqlite.sql`):

```sql
WITH RECURSIVE days AS (
    SELECT '2024-01-01' AS day
    UNION ALL
    SELECT date(day, '+1 day')
    FROM days
    WHERE day < '2024-01-09'
)
SELECT
    days.day,
    r.value
FROM days
LEFT JOIN readings AS r
       ON date(r.read_at) = days.day
      AND r.sensor = 'a'
ORDER BY days.day
```

**MySQL** (`query.mysql.sql`):

```sql
WITH RECURSIVE days AS (
    SELECT DATE '2024-01-01' AS day
    UNION ALL
    SELECT day + INTERVAL 1 DAY
    FROM days
    WHERE day < DATE '2024-01-09'
)
SELECT
    days.day,
    r.value
FROM days
LEFT JOIN readings AS r
       ON DATE(r.read_at) = days.day
      AND r.sensor = 'a'
ORDER BY days.day
```

## The result

Starting from the [`sensors` fixture](../../_fixtures/sensors.sql), every engine returns:

| `day` | `value` |
|---|---|
| 2024-01-01 | 20 |
| 2024-01-02 | 21.5 |
| 2024-01-03 | 19 |
| 2024-01-04 | 22 |
| 2024-01-05 | 23.5 |
| 2024-01-06 | *NULL* |
| 2024-01-07 | *NULL* |
| 2024-01-08 | 18 |
| 2024-01-09 | 18.5 |
<!-- /cook:sync -->
