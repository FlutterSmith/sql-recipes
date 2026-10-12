WITH totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
)
SELECT
    FLOOR(total / 50) * 50 AS bucket_start,
    COUNT(*) AS orders
FROM totals
GROUP BY FLOOR(total / 50) * 50
ORDER BY bucket_start
