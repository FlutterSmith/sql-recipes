SELECT
    customer_id,
    COUNT(*) AS orders,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_orders
FROM orders
GROUP BY customer_id
ORDER BY customer_id
