---
title: "Build JSON from columns"
summary: "One JSON object per row, and all of them in one array, straight from SQL."
tags: [json, group-by]
fixture: shop
related: [extract-json-field]
published: 2026-10-12
---

An API wants `{"id": 1, "name": "Ada Lovelace"}` per customer. Building it in the database saves a round trip per row and keeps the shape in one place.

## How it works

- The object function takes alternating keys and values.
- The array aggregate collects the objects of a group (here, the whole table) into one JSON array.
- Numbers stay numbers and `NULL` becomes JSON `null`; no string escaping to get wrong.

## Differences

- PostgreSQL: `jsonb_build_object` and `jsonb_agg`.
- MySQL: `JSON_OBJECT` and `JSON_ARRAYAGG`.
- SQLite: `json_object` and `json_group_array`. Aggregates don't take `ORDER BY` here either, so the rows are sorted in a subquery.
- DuckDB: `json_object` and `json_group_array`, the same names as SQLite. `json_group_array` is a macro, so it can't take an `ORDER BY`; sort in a subquery, as on SQLite and MySQL.

<!-- cook:sync -->

## The query

**PostgreSQL** (`query.sql`):

```sql
SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name) ORDER BY id) AS customers
FROM customers
```

**SQLite** (`query.sqlite.sql`):

```sql
SELECT json_group_array(json_object('id', id, 'name', name)) AS customers
FROM (SELECT id, name FROM customers ORDER BY id)
```

**MySQL** (`query.mysql.sql`):

```sql
SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name)) AS customers
FROM (SELECT id, name FROM customers ORDER BY id) AS ordered
```

**DuckDB** (`query.duckdb.sql`):

```sql
SELECT json_group_array(json_object('id', id, 'name', name)) AS customers
FROM (SELECT id, name FROM customers ORDER BY id)
```

## The result

Starting from the [`shop` fixture](../../_fixtures/shop.sql), every engine returns:

| `customers` |
|---|
| `[{"id": 1, "name": "Ada Lovelace"}, {"id": 2, "name": "Grace Hopper"}, {"id": 3, "name": "Linus Torvalds"}, {"id": 4, "name": "Margaret Hamilton"}]` |
<!-- /cook:sync -->
