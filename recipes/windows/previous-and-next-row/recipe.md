---
title: "Compare with the previous row"
summary: "Each reading next to the one before it, and the change between them, with LAG()."
tags: [window]
fixture: sensors
ordered: true
related: [moving-average, gaps-and-islands]
published: 2026-10-12
---

How much did the value move since the last reading? `LAG()` reaches back one row in the window's order and hands you its value, so the subtraction happens in the same row.

## How it works

- `LAG(value) OVER (PARTITION BY sensor ORDER BY read_at)` is the previous reading of the same sensor.
- The first row of each sensor has no previous reading, so `LAG` returns `NULL` and so does the delta.
- `LEAD()` looks forward instead. Both take an offset (`LAG(value, 7)`) and a default for the edge rows.

## Differences

- None in the function. Only the alias: `change` is reserved on MySQL, hence `delta`.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    read_at,
    value,
    LAG(value) OVER (PARTITION BY sensor ORDER BY read_at) AS previous,
    value - LAG(value) OVER (PARTITION BY sensor ORDER BY read_at) AS delta
FROM readings
WHERE sensor = 'a'
ORDER BY read_at
```

## The result

Starting from the [`sensors` fixture](../../_fixtures/sensors.sql), every engine returns:

| `read_at` | `value` | `previous` | `delta` |
|---|---|---|---|
| 2024-01-01 00:00:00 | 20 | *NULL* | *NULL* |
| 2024-01-02 00:00:00 | 21.5 | 20 | 1.5 |
| 2024-01-03 00:00:00 | 19 | 21.5 | -2.5 |
| 2024-01-04 00:00:00 | 22 | 19 | 3 |
| 2024-01-05 00:00:00 | 23.5 | 22 | 1.5 |
| 2024-01-08 00:00:00 | 18 | 23.5 | -5.5 |
| 2024-01-09 00:00:00 | 18.5 | 18 | 0.5 |
<!-- /cook:sync -->
