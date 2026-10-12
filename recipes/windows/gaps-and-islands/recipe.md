---
title: "Gaps and islands"
summary: "Streaks of consecutive days per sensor, with the row-number-minus-date trick."
tags: [window, date, cte]
fixture: sensors
ordered: true
related: [previous-and-next-row, generate-date-series]
published: 2026-10-12
---

Sensor `a` reported every day from the 1st to the 5th, went quiet, and came back on the 8th. Those are two islands with a gap between them. The trick: subtract each row's position from its date, and every island collapses to a single constant.

## How it works

- `ROW_NUMBER()` counts the readings of each sensor in date order: 1, 2, 3, ...
- Date minus row number is constant inside a streak (day 1 minus 1, day 2 minus 2, ...) and jumps after a gap.
- Grouping by sensor and that constant gives one row per island; `MIN` and `MAX` are its edges.

## Differences

- The date arithmetic is the only part that differs. PostgreSQL and DuckDB subtract an integer from a `DATE` directly; the cast is there because `ROW_NUMBER()` returns a bigint, which neither engine will subtract from a date.
- MySQL: `DATE_SUB(DATE(read_at), INTERVAL rn DAY)`.
- SQLite: `date(read_at, '-' || rn || ' days')`, since dates are text and the modifier is a string.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
WITH numbered AS (
    SELECT
        sensor,
        CAST(read_at AS DATE) AS day,
        ROW_NUMBER() OVER (PARTITION BY sensor ORDER BY read_at) AS rn
    FROM readings
),
islands AS (
    SELECT sensor, day, day - CAST(rn AS INTEGER) AS island
    FROM numbered
)
SELECT
    sensor,
    MIN(day) AS streak_start,
    MAX(day) AS streak_end,
    COUNT(*) AS days
FROM islands
GROUP BY sensor, island
ORDER BY sensor, streak_start
```

**SQLite** (`query.sqlite.sql`):

```sql
WITH numbered AS (
    SELECT
        sensor,
        date(read_at) AS day,
        ROW_NUMBER() OVER (PARTITION BY sensor ORDER BY read_at) AS rn
    FROM readings
),
islands AS (
    SELECT sensor, day, date(day, '-' || rn || ' days') AS island
    FROM numbered
)
SELECT
    sensor,
    MIN(day) AS streak_start,
    MAX(day) AS streak_end,
    COUNT(*) AS days
FROM islands
GROUP BY sensor, island
ORDER BY sensor, streak_start
```

**MySQL** (`query.mysql.sql`):

```sql
WITH numbered AS (
    SELECT
        sensor,
        DATE(read_at) AS day,
        ROW_NUMBER() OVER (PARTITION BY sensor ORDER BY read_at) AS rn
    FROM readings
),
islands AS (
    SELECT sensor, day, DATE_SUB(day, INTERVAL rn DAY) AS island
    FROM numbered
)
SELECT
    sensor,
    MIN(day) AS streak_start,
    MAX(day) AS streak_end,
    COUNT(*) AS days
FROM islands
GROUP BY sensor, island
ORDER BY sensor, streak_start
```

## The result

Starting from the [`sensors` fixture](../../_fixtures/sensors.sql), every engine returns:

| `sensor` | `streak_start` | `streak_end` | `days` |
|---|---|---|---|
| a | 2024-01-01 | 2024-01-05 | 5 |
| a | 2024-01-08 | 2024-01-09 | 2 |
| b | 2024-01-01 | 2024-01-03 | 3 |
| b | 2024-01-05 | 2024-01-06 | 2 |
<!-- /cook:sync -->
