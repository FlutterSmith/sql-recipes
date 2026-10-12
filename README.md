<a href="https://fluttersmith.github.io/sql-recipes/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/banner-dark.png">
    <img alt="fluttersmith/sql-recipes: SQL recipes that run on four databases. A console shows the same query under SQLite, PostgreSQL, MySQL and DuckDB tabs, with a tick for each engine." src=".github/assets/banner-light.png" width="100%">
  </picture>
</a>

<p align="center">
  <a href="https://fluttersmith.github.io/sql-recipes/"><b>Read on the web</b></a> ·
  <a href="MATRIX.md">The compatibility matrix</a> ·
  <a href="recipes/_fixtures">The data</a> ·
  <a href="CONTRIBUTING.md">Add a recipe</a>
</p>

<p align="center">
  <a href="https://github.com/FlutterSmith/sql-recipes/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/FlutterSmith/sql-recipes/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="51 recipes" src="https://img.shields.io/badge/recipes-51-17181C">
  <img alt="SQLite, PostgreSQL, MySQL, DuckDB" src="https://img.shields.io/badge/engines-SQLite_|_PostgreSQL_|_MySQL_|_DuckDB-B4531C">
  <img alt="203 engine runs" src="https://img.shields.io/badge/engine_runs-203_passing-1F7A4D">
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-F0A33A">
</p>

You know the query you need. You've written it before. On the other database.

Every SQL cheat sheet gives you one answer, and it quietly assumes one engine. Top-N-per-group, upserts, string splitting, date truncation, pagination: each of them is spelled differently on SQLite, PostgreSQL, MySQL and DuckDB, and the differences are exactly the parts you forget. This collection gives you one recipe per problem with a query for each engine, and every query is run against a real server before it can appear here.

## One problem, four engines

Join the product names of each order into one string, in alphabetical order:

<table>
<tr><th>PostgreSQL · DuckDB</th><th>MySQL</th><th>SQLite</th></tr>
<tr><td>

```sql
string_agg(p.name, ', '
           ORDER BY p.name)
```

</td><td>

```sql
GROUP_CONCAT(p.name
             ORDER BY p.name
             SEPARATOR ', ')
```

</td><td>

```sql
group_concat(p.name, ', '
             ORDER BY p.name)
```

</td></tr>
</table>

That's [one recipe](recipes/aggregation/string-aggregation/recipe.md). Its page also tells you that MySQL truncates the result at 1,024 bytes unless you raise `group_concat_max_len`, and that the `ORDER BY` inside SQLite's aggregate needs 3.44 or newer. Those are the details that cost an afternoon.

## What makes the ticks mean something

```
recipes/aggregation/string-aggregation/
├── recipe.md           the problem, how it works, and what differs per engine
├── query.sql           the shared query (PostgreSQL and DuckDB run this one)
├── query.mysql.sql     MySQL's spelling
├── query.sqlite.sql    SQLite's spelling
└── expected.json       the rows every engine must return
```

`cook run` loads the recipe's fixture into each engine, runs the query, and compares the rows with `expected.json`. CI does this on every push against PostgreSQL 16, 17 and 18 and MySQL 8.0, 8.4 and 9 in service containers, plus SQLite and DuckDB in-process. A recipe that fails on any of them can't be merged. The tick next to each engine on the website is the result of that run, with the version it ran on.

When an engine can't do something at all, the recipe says so instead of pretending: SQLite has no `LATERAL` join, MySQL has no `FULL OUTER JOIN`, neither has `percentile_cont`. Each of those gets a variant that works, or a pointer to the recipe that does.

<img alt="The latest-row-per-group recipe page: a dialect block with SQLite, PostgreSQL, MySQL and DuckDB tabs, the result grid underneath, and the engine strip with four ticks and versions." src=".github/assets/screen-recipe.png" width="100%">

## What you get

| | |
|:--|:--|
| **51 recipes in 10 categories** | Filtering, aggregation, window functions, joins, duplicates and upserts, dates, strings, JSON, recursive queries, pagination. |
| **A query per engine** | Standard SQL where all four agree, and the engine's own idiom where they don't. [The matrix](MATRIX.md) shows which is which. |
| **Expected rows you can read** | Three small fixtures (a shop, a company, two sensors) that you'll know by heart after a few recipes, so the results make sense at a glance. |
| **Run it in your browser** | SQLite, PostgreSQL and DuckDB exist as WebAssembly. One click runs the recipe on the real engine in the page, and you can edit the query. |
| **The gotchas, named** | Reserved words that only MySQL rejects, the `LAST_VALUE` frame trap, `NULL = NULL`, recursive CTE column sizing, three different weekday numberings. |
| **Checked weekly** | A scheduled run against the newest engine releases opens an issue if anything stops passing. |

## A quick tour

<table>
  <tr>
    <td width="50%"><img alt="Home page: the headline SQL recipes that run on four databases, a hero recipe with dialect tabs, and the index as a ledger with a four-engine strip per row." src=".github/assets/screen-home.png"></td>
    <td width="50%"><img alt="The Run panel after running a recipe on PostgreSQL in the browser: the live result grid and a tick saying it matches the expected rows." src=".github/assets/screen-run.png"></td>
  </tr>
  <tr>
    <td><b>Home.</b> Every row ends with the four engines.</td>
    <td><b>Run.</b> PostgreSQL, in the page, from a click.</td>
  </tr>
  <tr>
    <td><img alt="The compatibility matrix: every recipe against every engine, with ticks, dotted ticks for variants and dashes for unsupported." src=".github/assets/screen-matrix.png"></td>
    <td><img alt="The 404 page styled as a psql error: relation this_page does not exist, with a hint naming the closest recipe." src=".github/assets/screen-404.png"></td>
  </tr>
  <tr>
    <td><b>The matrix.</b> Which engines need their own spelling.</td>
    <td><b>Not found.</b> With a hint, like psql.</td>
  </tr>
</table>

## The recipes

<!-- cook:catalog -->

**51 recipes** in 10 categories. Open a category to see what's inside.

<details>
<summary><b>Filtering and lookup</b> · 7</summary>

- [Case-insensitive search](recipes/filtering/case-insensitive-search/recipe.md): Match text regardless of case, with LOWER(), ILIKE, or the engine's default collation.
- [Customers who bought from a category](recipes/filtering/exists-vs-in/recipe.md): Rows that have at least one match two joins away, with EXISTS instead of a join that duplicates rows.
- [Latest order per customer](recipes/filtering/latest-row-per-group/recipe.md): For each customer, the single most recent order, with a window function or DISTINCT ON.
- [Compare values that may be NULL](recipes/filtering/null-safe-equality/recipe.md): Treat two NULLs as equal, with IS NOT DISTINCT FROM, IS, or <=>, depending on the engine.
- [Rows in a date range](recipes/filtering/rows-in-a-date-range/recipe.md): Orders placed in March, with a half-open range instead of BETWEEN.
- [Customers with no orders](recipes/filtering/rows-with-no-match/recipe.md): Rows in one table with no related row in another, with NOT EXISTS (an anti join).
- [Top N per group](recipes/filtering/top-n-per-group/recipe.md): The two most expensive products in each category, with a window function.

</details>
<details>
<summary><b>Aggregation</b> · 8</summary>

- [Count rows that meet a condition](recipes/aggregation/conditional-count/recipe.md): Count all orders and only the paid ones in one pass, with FILTER or CASE.
- [Distinct values per group](recipes/aggregation/distinct-count-per-group/recipe.md): How many different products each customer has bought, with COUNT(DISTINCT ...).
- [Histogram buckets](recipes/aggregation/histogram-buckets/recipe.md): Count order totals in bands of 50, by rounding each total down to its band.
- [Median](recipes/aggregation/median/recipe.md): The median order total, with percentile_cont where it exists and a window trick where it doesn't.
- [Total per order](recipes/aggregation/order-totals/recipe.md): Sum line items into an order total with a join and GROUP BY.
- [Percent of total](recipes/aggregation/percent-of-total/recipe.md): Each category's share of revenue, with a window function over the aggregate.
- [Pivot rows into columns](recipes/aggregation/pivot-with-case/recipe.md): One column per order status, with SUM(CASE ...), or DuckDB's PIVOT.
- [Join values into one string per group](recipes/aggregation/string-aggregation/recipe.md): The product names of each order as one comma-separated string, in alphabetical order.

</details>
<details>
<summary><b>Window functions</b> · 7</summary>

- [First and last value per group](recipes/windows/first-and-last-per-group/recipe.md): Each sensor's first and latest reading on one row, with FIRST_VALUE and LAST_VALUE.
- [Gaps and islands](recipes/windows/gaps-and-islands/recipe.md): Streaks of consecutive days per sensor, with the row-number-minus-date trick.
- [Moving average](recipes/windows/moving-average/recipe.md): The average of each reading and the two before it, with a ROWS frame.
- [Split rows into equal bands](recipes/windows/ntile-bands/recipe.md): Employees in three salary bands of equal size, with NTILE().
- [Compare with the previous row](recipes/windows/previous-and-next-row/recipe.md): Each reading next to the one before it, and the change between them, with LAG().
- [RANK, DENSE_RANK and ROW_NUMBER](recipes/windows/rank-dense-rank-row-number/recipe.md): The three ranking functions side by side, so you can see how each one treats ties.
- [Running total](recipes/windows/running-total/recipe.md): Cumulative revenue over time, with SUM() OVER (ORDER BY ...).

</details>
<details>
<summary><b>Joins and sets</b> · 5</summary>

- [Totals per customer without double counting](recipes/joins/aggregate-without-fan-out/recipe.md): Spend per customer, aggregating the detail table before joining so nothing is counted twice.
- [Full outer join](recipes/joins/full-outer-join/recipe.md): Rows from both tables, matched where possible, with FULL OUTER JOIN or a UNION of two outer joins.
- [Lateral join](recipes/joins/lateral-join/recipe.md): The two most recent orders of every customer, with a subquery that can see the outer row. *(not on SQLite)*
- [Pairs within a group](recipes/joins/self-join-pairs/recipe.md): Every pair of products in the same category, listed once, with a self-join.
- [Rows in one set but not another](recipes/joins/set-difference/recipe.md): Products Ada bought that Linus never did, with EXCEPT.

</details>
<details>
<summary><b>Duplicates and upserts</b> · 5</summary>

- [Delete duplicates, keep one](recipes/dedupe/delete-duplicates/recipe.md): Remove every copy but the one with the lowest id, with a self-join DELETE or NOT IN.
- [Find duplicate rows](recipes/dedupe/find-duplicates/recipe.md): Values that appear more than once, and how many times, with GROUP BY and HAVING.
- [Insert only if the row is missing](recipes/dedupe/insert-if-not-exists/recipe.md): Add a row unless its key already exists, with ON CONFLICT DO NOTHING, INSERT OR IGNORE, or INSERT IGNORE.
- [Update from another table](recipes/dedupe/update-from-another-table/recipe.md): Apply a table of price changes to the products table, with UPDATE ... FROM or an UPDATE join.
- [Insert or update (upsert)](recipes/dedupe/upsert/recipe.md): Insert a row, or add to it when the key already exists, with ON CONFLICT or ON DUPLICATE KEY.

</details>
<details>
<summary><b>Dates and times</b> · 6</summary>

- [Day of the week](recipes/dates/day-of-week/recipe.md): Orders per weekday, numbered Monday = 1 to Sunday = 7, on engines that each count differently.
- [Days between two dates](recipes/dates/days-between/recipe.md): How many days passed between sign-up and first order, four different ways.
- [Fill missing dates](recipes/dates/generate-date-series/recipe.md): One row per calendar day, with the reading or NULL, from a generated series of dates.
- [Find overlapping date ranges](recipes/dates/overlapping-ranges/recipe.md): Bookings that overlap a given period, with the two-comparison test that covers every case.
- [Group by month](recipes/dates/truncate-to-month/recipe.md): Revenue per calendar month, with date_trunc, DATE_FORMAT or strftime.
- [Whole years between two dates](recipes/dates/years-of-service/recipe.md): Completed years of service as of a given date, counting birthdays, not year boundaries.

</details>
<details>
<summary><b>Strings</b> · 5</summary>

- [Join parts of a name, skipping NULLs](recipes/strings/concat-with-nulls/recipe.md): Build a full name from parts that may be NULL, with CONCAT_WS.
- [Trim and collapse whitespace](recipes/strings/normalize-whitespace/recipe.md): Strip the ends and squeeze runs of spaces to one, with a regex or a replace trick.
- [Split a string into rows](recipes/strings/split-string-into-rows/recipe.md): A comma-separated column turned into one row per value, with unnest or a JSON detour.
- [Text after a delimiter](recipes/strings/substring-after-delimiter/recipe.md): The domain part of each email address, and how many people use it.
- [Zero-pad a number](recipes/strings/zero-pad-numbers/recipe.md): Invoice numbers like INV-00042, with LPAD or printf.

</details>
<details>
<summary><b>JSON</b> · 3</summary>

- [Build JSON from columns](recipes/json/build-json/recipe.md): One JSON object per row, and all of them in one array, straight from SQL.
- [Read a field out of JSON](recipes/json/extract-json-field/recipe.md): A top-level string and a nested number pulled out of a JSON column, as SQL values.
- [Expand a JSON array into rows](recipes/json/json-array-to-rows/recipe.md): One row per element of a JSON array, next to the row it came from.

</details>
<details>
<summary><b>Recursive queries</b> · 3</summary>

- [Generate a series of numbers](recipes/recursive/number-series/recipe.md): The numbers 1 to 5 and their squares, from nothing, with a recursive CTE or generate_series.
- [Path from the root](recipes/recursive/path-from-root/recipe.md): Each employee's chain of command as one string, built up through the recursion.
- [Walk a hierarchy](recipes/recursive/walk-a-hierarchy/recipe.md): Everyone under a manager, at any depth, with a recursive CTE.

</details>
<details>
<summary><b>Pagination</b> · 2</summary>

- [Page with a keyset (seek method)](recipes/pagination/keyset-pagination/recipe.md): The next page after a known row, with a row-value comparison that uses the index.
- [Page with OFFSET](recipes/pagination/offset-pagination/recipe.md): The second page of three orders, with LIMIT and OFFSET, and why it gets slow.

</details>
<!-- /cook:catalog -->

## Run it locally

You need [uv](https://docs.astral.sh/uv/). SQLite and DuckDB run in-process. For PostgreSQL and MySQL, use the included `compose.yaml` or point at servers of your own.

```sh
uv sync
docker compose up -d
export PGURL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
export MYSQL_URL=mysql://root:root@127.0.0.1:3306

uv run cook run                    # every recipe on every engine you can reach
uv run cook run median -e sqlite   # one recipe, one engine
uv run pytest                      # the same, as a test suite, plus the tool's own tests
uv run cook validate               # content rules
uv run cook generate --site        # MATRIX.md, this catalog, and the website's data
cd site && npm ci && npm run build && npm run preview
```

Without `PGURL` and `MYSQL_URL`, `cook run` skips those two engines and says so.

## Contributing

Found a query that fails on your engine version? [Open an issue](https://github.com/FlutterSmith/sql-recipes/issues/new/choose) with the version. Have a problem that deserves a recipe? `uv run cook new strings reverse-words` scaffolds the folder. [CONTRIBUTING.md](CONTRIBUTING.md) explains the format and the rules, which CI enforces.

The reasoning behind the project, the design of the site, and what the engines taught me while writing the recipes are in [`docs/`](docs/).

## License

[MIT](LICENSE).
