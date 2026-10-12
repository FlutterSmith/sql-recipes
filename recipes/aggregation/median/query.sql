WITH totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
),
ranked AS (
    SELECT
        total,
        ROW_NUMBER() OVER (ORDER BY total) AS rn,
        COUNT(*) OVER () AS cnt
    FROM totals
)
SELECT AVG(total) AS median_total
FROM ranked
WHERE rn BETWEEN cnt / 2.0 AND cnt / 2.0 + 1
