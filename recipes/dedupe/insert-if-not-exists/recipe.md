---
title: "Insert only if the row is missing"
summary: "Add a row unless its key already exists, with ON CONFLICT DO NOTHING, INSERT OR IGNORE, or INSERT IGNORE."
tags: [upsert]
ordered: true
related: [upsert]
published: 2026-10-12
---

Seed data, idempotent imports, 'create if missing': you want the insert to succeed when the key is new and do nothing when it's taken, without an error either way.

## How it works

- The engine tries the insert and, on a primary key clash, drops that row and carries on with the next.
- `B` already exists and is left untouched; `C` is new and goes in.
- A `SELECT ... WHERE NOT EXISTS` form works on every engine, but it isn't atomic: two sessions can both see 'missing' and one of them will fail.

## Differences

- PostgreSQL and DuckDB: `ON CONFLICT DO NOTHING`.
- SQLite: `INSERT OR IGNORE`. The `ON CONFLICT DO NOTHING` form also works since 3.24.
- MySQL: `INSERT IGNORE`, which also swallows other errors (bad values become warnings), so check the warnings.

<!-- cook:sync -->

## The query

**PostgreSQL, DuckDB** (`query.sql`):

```sql
INSERT INTO stock (sku, qty)
VALUES ('B', 99), ('C', 1)
ON CONFLICT (sku) DO NOTHING;

SELECT sku, qty
FROM stock
ORDER BY sku
```

**SQLite** (`query.sqlite.sql`):

```sql
INSERT OR IGNORE INTO stock (sku, qty)
VALUES ('B', 99), ('C', 1);

SELECT sku, qty
FROM stock
ORDER BY sku
```

**MySQL** (`query.mysql.sql`):

```sql
INSERT IGNORE INTO stock (sku, qty)
VALUES ('B', 99), ('C', 1);

SELECT sku, qty
FROM stock
ORDER BY sku
```

## The result

Starting from `setup.sql`, every engine returns:

| `sku` | `qty` |
|---|---|
| A | 10 |
| B | 5 |
| C | 1 |
<!-- /cook:sync -->
