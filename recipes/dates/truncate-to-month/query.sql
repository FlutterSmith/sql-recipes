SELECT
    CAST(date_trunc('month', o.ordered_at) AS DATE) AS month,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
WHERE o.status = 'paid'
GROUP BY CAST(date_trunc('month', o.ordered_at) AS DATE)
ORDER BY month
