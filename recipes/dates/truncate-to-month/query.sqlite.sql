SELECT
    strftime('%Y-%m-01', o.ordered_at) AS month,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
WHERE o.status = 'paid'
GROUP BY strftime('%Y-%m-01', o.ordered_at)
ORDER BY month
