# Changelog

## 0.1.0 (2026-10-12)

First release.

- 51 recipes in 10 categories, each run on SQLite, PostgreSQL, MySQL and DuckDB before it can ship: 203 passing engine runs, and one documented "can't" (SQLite has no `LATERAL` join).
- Three fixtures shared across the recipes: a shop, a company and two sensors.
- The `cook` CLI: `run`, `validate`, `generate`, `new`.
- CI on real servers: PostgreSQL 16, 17 and 18, MySQL 8.0, 8.4 and 9. A weekly run against the newest releases.
- Website with dialect tabs, result grids, the compatibility matrix, and in-browser runs on SQLite, PostgreSQL and DuckDB.
