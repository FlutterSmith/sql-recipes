---
title: "Trim and collapse whitespace"
summary: "Strip the ends and squeeze runs of spaces to one, with a regex or a replace trick."
tags: [text]
ordered: true
published: 2026-10-12
---

User input arrives as `'  hello   world '`. You want `'hello world'`: no leading or trailing space, and single spaces inside. Three engines have regular expressions for the inside part. SQLite doesn't, and has a trick instead.

## How it works

- `TRIM` removes the spaces at both ends.
- `regexp_replace(..., '\s+', ' ', 'g')` replaces every run of whitespace with one space. The `g` flag means every run, not only the first.
- The SQLite version replaces each space with `<>`, deletes every `><` (which is where runs were), and turns the surviving `<>` back into a space.

## Differences

- PostgreSQL and DuckDB: `regexp_replace` with the `'g'` flag.
- MySQL: `REGEXP_REPLACE` (8.0+) replaces all occurrences by default; the pattern needs `\\s` because the string literal eats one backslash.
- SQLite: no regex functions out of the box, so the three-`REPLACE` trick. It handles spaces only, not tabs.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
SELECT
    id,
    regexp_replace(TRIM(raw), '\s+', ' ', 'g') AS cleaned
FROM inputs
ORDER BY id
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT
    id,
    replace(replace(replace(TRIM(raw), ' ', '<>'), '><', ''), '<>', ' ') AS cleaned
FROM inputs
ORDER BY id
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT
    id,
    REGEXP_REPLACE(TRIM(raw), '\\s+', ' ') AS cleaned
FROM inputs
ORDER BY id
```

## The result

Starting from `setup.sql`, every engine returns:

| `id` | `cleaned` |
|---|---|
| 1 | hello world |
| 2 | one two three |
| 3 | tidy |
<!-- /cook:sync -->
