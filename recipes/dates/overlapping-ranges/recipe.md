---
title: "Find overlapping date ranges"
summary: "Bookings that overlap a given period, with the two-comparison test that covers every case."
tags: [date]
ordered: true
related: [rows-in-a-date-range]
published: 2026-10-12
---

Two ranges overlap when each one starts before the other ends. That's the whole test, and it covers partial overlaps, containment and identical ranges. Writing out the cases by hand is how bugs get in.

## How it works

- `starts_on < '2024-01-26'`: the booking starts before the period ends.
- `ends_on > '2024-01-14'`: the booking ends after the period starts.
- Both true means overlap. With `<=` and `>=` instead, ranges that touch at an endpoint count too.

## Differences

- None: comparisons between dates and ISO strings work on all four. PostgreSQL also has `daterange` types with an `&&` overlap operator, and `OVERLAPS`, for when you want it spelled out.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT id, starts_on, ends_on
FROM bookings
WHERE starts_on < '2024-01-26'
  AND ends_on   > '2024-01-14'
ORDER BY starts_on
```

## The result

Starting from `setup.sql`, every engine returns:

| `id` | `starts_on` | `ends_on` |
|---|---|---|
| 1 | 2024-01-10 | 2024-01-15 |
| 2 | 2024-01-14 | 2024-01-20 |
| 3 | 2024-01-25 | 2024-01-30 |
<!-- /cook:sync -->
