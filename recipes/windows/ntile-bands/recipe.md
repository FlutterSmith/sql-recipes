---
title: "Split rows into equal bands"
summary: "Employees in three salary bands of equal size, with NTILE()."
tags: [window, ranking]
fixture: hr
ordered: true
related: [rank-dense-rank-row-number, histogram-buckets]
published: 2026-10-12
---

Top third, middle third, bottom third. `NTILE(n)` deals rows into `n` bands of as-equal-as-possible size, in the window's order.

## How it works

- `NTILE(3) OVER (ORDER BY salary DESC, name)` assigns band 1 to the highest third of salaries.
- Nine rows split 3-3-3. Ten would split 4-3-3: the earlier bands get the extra rows.
- Ties can land in different bands, as Sam and Tariq do here. Use `NTILE` for quantiles of a distribution, not for grouping equal values.

## Differences

- None: standard SQL on all four engines.

<!-- cook:sync -->

## The query

**SQLite, PostgreSQL, MySQL, DuckDB** (`query.sql`):

```sql
SELECT
    name,
    salary,
    NTILE(3) OVER (ORDER BY salary DESC, name) AS band
FROM employees
ORDER BY salary DESC, name
```

## The result

Starting from the [`hr` fixture](../../_fixtures/hr.sql), every engine returns:

| `name` | `salary` | `band` |
|---|---|---|
| Nadia | 9800 | 1 |
| Omar | 7200 | 1 |
| Priya | 7200 | 1 |
| Rosa | 6400 | 2 |
| Quentin | 5100 | 2 |
| Sam | 4300 | 2 |
| Tariq | 4300 | 3 |
| Uma | 3900 | 3 |
| Viktor | 3500 | 3 |
<!-- /cook:sync -->
