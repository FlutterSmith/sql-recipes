---
title: "Text after a delimiter"
summary: "The domain part of each email address, and how many people use it."
tags: [text, group-by]
ordered: true
related: [split-string-into-rows]
published: 2026-10-12
---

Everything after the `@` is the domain. Each engine has a different way to say 'the part after this character'.

## How it works

- The domain expression cuts the address at the `@` and keeps what follows.
- Grouping by it counts the addresses per domain.
- The same functions, with a different index or sign, give the part before the delimiter.

## Differences

- PostgreSQL and DuckDB: `split_part(email, '@', 2)` is the second piece. Pieces count from 1.
- MySQL: `SUBSTRING_INDEX(email, '@', -1)` is everything after the last `@`; a positive count keeps the part before.
- SQLite: `substr(email, instr(email, '@') + 1)`, since there's no split function.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT
    split_part(email, '@', 2) AS domain,
    COUNT(*) AS people
FROM contacts
GROUP BY split_part(email, '@', 2)
ORDER BY domain
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    substr(email, instr(email, '@') + 1) AS domain,
    COUNT(*) AS people
FROM contacts
GROUP BY substr(email, instr(email, '@') + 1)
ORDER BY domain
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    SUBSTRING_INDEX(email, '@', -1) AS domain,
    COUNT(*) AS people
FROM contacts
GROUP BY SUBSTRING_INDEX(email, '@', -1)
ORDER BY domain
```

## The result

Starting from `setup.sql`, every engine returns:

| `domain` | `people` |
|---|---|
| example.com | 2 |
| example.org | 1 |
| mail.example.net | 2 |
<!-- /cook:sync -->
