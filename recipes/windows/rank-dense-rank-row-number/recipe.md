---
title: "RANK, DENSE_RANK and ROW_NUMBER"
summary: "The three ranking functions side by side, so you can see how each one treats ties."
tags: [window, ranking]
fixture: hr
ordered: true
related: [top-n-per-group, ntile-bands]
published: 2026-10-12
---

Three functions rank rows, and they only differ on ties. Omar and Priya earn the same, and so do Sam and Tariq. Watch what each function does with them.

## How it works

- `ROW_NUMBER()` never ties: equal salaries get consecutive numbers in `ORDER BY` order, so add a tie-breaker (`name`) to make it deterministic.
- `RANK()` gives ties the same number and then skips: 2, 2, 4.
- `DENSE_RANK()` gives ties the same number and doesn't skip: 2, 2, 3.

## Differences

- None: all three functions are standard and behave the same on every engine here.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC, name) AS row_num,
    RANK()       OVER (ORDER BY salary DESC) AS rnk,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense
FROM employees
ORDER BY salary DESC, name
```

## The result

Starting from the [`hr` fixture](../../_fixtures/hr.sql), every engine returns:

| `name` | `salary` | `row_num` | `rnk` | `dense` |
|---|---|---|---|---|
| Nadia | 9800 | 1 | 1 | 1 |
| Omar | 7200 | 2 | 2 | 2 |
| Priya | 7200 | 3 | 2 | 2 |
| Rosa | 6400 | 4 | 4 | 3 |
| Quentin | 5100 | 5 | 5 | 4 |
| Sam | 4300 | 6 | 6 | 5 |
| Tariq | 4300 | 7 | 6 | 5 |
| Uma | 3900 | 8 | 8 | 6 |
| Viktor | 3500 | 9 | 9 | 7 |
<!-- /cook:sync -->
