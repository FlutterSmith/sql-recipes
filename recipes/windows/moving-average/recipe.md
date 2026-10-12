---
title: "Moving average"
summary: "The average of each reading and the two before it, with a ROWS frame."
tags: [window]
fixture: sensors
ordered: true
related: [running-total, previous-and-next-row]
published: 2026-10-12
---

A moving average smooths a noisy series. The window frame says how far back to look: here, the current reading and the two before it.

## How it works

- `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` is a frame of up to three rows ending at the current one.
- The first two rows have fewer than three readings available, so their average covers what exists.
- `ROUND(..., 2)` keeps the output readable. Round at the end, never inside the window.

## Differences

- None: standard SQL. The unrounded average is a decimal on PostgreSQL and MySQL and a double on SQLite and DuckDB.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    read_at,
    value,
    ROUND(AVG(value) OVER (
        ORDER BY read_at
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 2) AS avg_3
FROM readings
WHERE sensor = 'a'
ORDER BY read_at
```

## The result

Starting from the [`sensors` fixture](../../_fixtures/sensors.sql), every engine returns:

| `read_at` | `value` | `avg_3` |
|---|---|---|
| 2024-01-01 00:00:00 | 20 | 20 |
| 2024-01-02 00:00:00 | 21.5 | 20.75 |
| 2024-01-03 00:00:00 | 19 | 20.17 |
| 2024-01-04 00:00:00 | 22 | 20.83 |
| 2024-01-05 00:00:00 | 23.5 | 21.5 |
| 2024-01-08 00:00:00 | 18 | 21.17 |
| 2024-01-09 00:00:00 | 18.5 | 20 |
<!-- /cook:sync -->
