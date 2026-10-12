WITH totals AS (
    SELECT
        o.id AS order_id,
        o.ordered_at,
        SUM(oi.quantity * oi.unit_price) AS total
    FROM orders AS o
    JOIN order_items AS oi ON oi.order_id = o.id
    WHERE o.status = 'paid'
    GROUP BY o.id, o.ordered_at
)
SELECT
    order_id,
    ordered_at,
    total,
    SUM(total) OVER (
        ORDER BY ordered_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM totals
ORDER BY ordered_at
