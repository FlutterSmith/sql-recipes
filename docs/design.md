# sql-recipes: Look & Feel

> Status: **approved**. A sibling of [tips](https://github.com/FlutterSmith/tips) and [py-snippets](https://github.com/FlutterSmith/py-snippets): the same family, its own personality.

## 1. The idea: "the console, typeset"

SQL lives in a console: you type a query, the engine prints a grid. `psql`, `sqlite3`, `mysql` and `duckdb` all draw that grid with box-drawing characters. This site keeps the grid and the monospace honesty, and typesets it like a good reference book.

- **Light theme = paper console.** Warm off-white paper, near-black ink, rust accents. Hairline rules, not boxes.
- **Dark theme = night console.** Deep blue-black, amber accents, the grid drawn in soft rules.
- **The dialect block is the hero component.** One SQL block with four tabs (`SQLite · PostgreSQL · MySQL · DuckDB`). Tabs with a dialect-specific variant carry a small dot; a tab for an unsupported engine is crossed out and shows the reason. Switching tabs keeps scroll position.
- **The result grid** under each query is a real table in monospace: right-aligned numbers, `NULL` in muted italics, and the engine strip above it: `SQLite 3.45 ✓ · PostgreSQL 16 ✓ · MySQL 8.0 ✓ · DuckDB 1.5 ✓`, with the version each tick came from.
- **Run in your browser** opens a console under the recipe with a real engine: SQLite (sql.js), PostgreSQL (PGlite) and DuckDB (duckdb-wasm) all exist as WebAssembly. MySQL doesn't, and the panel says so.

The contrast: **machine-made grids and ticks** next to **a serif voice explaining them**.

## 2. Tokens

| Token | Light (paper) | Dark (night) | Role |
|---|---|---|---|
| `--ground` | `#F7F5F0` | `#0D1117` | Page |
| `--paper` | `#FDFCF9` | `#131A24` | Raised areas, code blocks on light |
| `--ink` | `#17181C` | `#E8EAF0` | Text |
| `--ink-2` | `#55585F` | `#9AA3B2` | Secondary |
| `--rule` | `#D9D5CC` | `#243041` | Hairlines, grid lines |
| `--accent` | `#B4531C` | `#F0A33A` | Links, active tab, focus, ticks' label |
| `--pass` | `#1F7A4D` | `#5CD39A` | Ticks |
| `--fail` | `#B32D2D` | `#FF7B7B` | A failed run (glyph + colour) |
| `--console` | `#14181F` | `#090C12` | The SQL block and result grid (dark in both themes) |
| `--console-ink` | `#E6E9EF` | `#E6E9EF` | Text on the console |

Syntax colours on the console: keywords `#8FBCFF`, functions `#F2D38A`, strings `#A8DCA0`, numbers `#FFB38A`, identifiers `#E6E9EF`, comments `#7D8798` italic. Checked for AA.

**Type:**

| Role | Face | Why |
|---|---|---|
| Display | **Instrument Serif** | A sharp, slightly old-fashioned serif for titles. Italic for emphasis words |
| Body | IBM Plex Sans | Neutral, wide language support, pairs with Plex Mono |
| SQL, grids, metadata | IBM Plex Mono | Clear at small sizes, distinct `0`/`O`, `1`/`l` |

Scale 1.25 from 17px. Prose at most 66ch. All faces self-hosted via @fontsource.

**Shape:** 2px radius on UI, 8px on the console. No card grids. Rows and hairlines.

## 3. Key screens

**Home**
```
fluttersmith/sql-recipes          Search ( / )   Matrix   ◐   GitHub ↗
──────────────────────────────────────────────────────────────────────
SQL recipes that run                 ┌ latest-row-per-group ──────────┐
on four databases.                   │ SQLite PostgreSQL• MySQL DuckDB │
                                     │ WITH ranked AS (                │
51 problems. One tested query        │   SELECT ... ROW_NUMBER() ...   │
per engine. Results checked          │ ...                             │
in CI on real servers.               ├─────────────────────────────────┤
[Random recipe r] [The matrix ▸]     │ customer_id │ order_id │ ...    │
                                     │ SQLite 3.45 ✓ PostgreSQL 16 ✓ …  │  ← ticks land one by one
──────────────────────────────────────────────────────────────────────
Filtering and lookup  7     Latest order per customer     ✓ ✓ ✓ ✓
Aggregation           8     Top N per group               ✓ ✓ ✓ ✓
Window functions      7     Lateral join                  – ✓ ✓ ✓
...
```
The index is a ledger: category rows with the recipe rows under them, each ending in the four-engine strip.

**Recipe page:** breadcrumb `Window functions` → the title in Instrument Serif → summary → fixture line ("Starts from the `shop` fixture: 4 customers, 6 products, 8 orders" with a toggle that shows its SQL) → the dialect block → the result grid with the engine strip → `[▶ Run in your browser]` → "How it works" → "Differences" (one bullet per engine where they differ) → related → previous/next.

**The matrix** (`/matrix/`): every recipe × every engine, as a table. ✓ for the shared query, ✓ with a dot for a variant, – with a tooltip for unsupported. Filter box. Engine versions in the header.

**Fixtures** (`/fixtures/`): the three datasets, their DDL and rows, since readers need to know the data to read the results.

**404:** a console error.
```
ERROR:  relation "this_page" does not exist
LINE 1: SELECT * FROM this_page;
                      ^
HINT:  Perhaps you meant "latest-row-per-group".
```
The hint is a real fuzzy match on the URL.

## 4. Motion

- **One orchestrated moment:** on the home page, the hero's four engine ticks land in turn (≈ 700ms total), each with its version. Complete at rest; reduced motion shows it finished.
- Tab switches crossfade the SQL in 120ms. Run results slide in from the console's prompt line.
- Nothing scrolls, parallaxes or floats.

## 5. Voice

Plain, specific, no emoji, no hype. SQL-specific rules:
- Name the engine and version when something changed ("MySQL 8.0.31 added `EXCEPT`").
- Say what the query costs when it matters (offset pages, correlated subqueries).
- Prefer the standard spelling as the shared query, and show the engine's idiom as the variant.

## 6. Accessibility and performance

- Tabs are real `role="tablist"` tabs, keyboard operable with arrow keys.
- Ticks have text equivalents ("passes on PostgreSQL 16.13").
- The result grid is a real `<table>` with `<th scope="col">`.
- Engines load only when Run is clicked, with an honest size line. A page without Run ships ≤ 25KB JS.
- Lighthouse ≥ 95.
