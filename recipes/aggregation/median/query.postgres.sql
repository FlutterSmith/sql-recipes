WITH totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
)
SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY total) AS median_total
FROM totals
