SELECT
    DATE(DATE_FORMAT(o.ordered_at, '%Y-%m-01')) AS month,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
WHERE o.status = 'paid'
GROUP BY DATE(DATE_FORMAT(o.ordered_at, '%Y-%m-01'))
ORDER BY month
