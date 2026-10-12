---
title: "First and last value per group"
summary: "Each sensor's first and latest reading on one row, with FIRST_VALUE and LAST_VALUE."
tags: [window]
fixture: sensors
ordered: true
related: [latest-row-per-group]
published: 2026-10-12
---

You want the opening and the closing reading of each sensor side by side. `FIRST_VALUE` is straightforward. `LAST_VALUE` has a trap: with the default frame it returns the current row, not the last one.

## How it works

- `FIRST_VALUE(value) OVER (PARTITION BY sensor ORDER BY read_at)` is the earliest reading of the sensor.
- `LAST_VALUE` needs `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`. The default frame ends at the current row, which makes `LAST_VALUE` equal to `value` on every row.
- Every row of a sensor carries the same two values, so `DISTINCT` collapses them to one row per sensor.

## Differences

- None: the frame trap is in the SQL standard, so all four engines share it. `first_value` and `last_value` are reserved on MySQL, so the aliases are `opening` and `latest`.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT DISTINCT
    sensor,
    FIRST_VALUE(value) OVER (
        PARTITION BY sensor ORDER BY read_at
    ) AS opening,
    LAST_VALUE(value) OVER (
        PARTITION BY sensor ORDER BY read_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS latest
FROM readings
ORDER BY sensor
```

## The result

Starting from the [`sensors` fixture](../../_fixtures/sensors.sql), every engine returns:

| `sensor` | `opening` | `latest` |
|---|---|---|
| a | 20 | 18.5 |
| b | 30 | 32 |
<!-- /cook:sync -->
