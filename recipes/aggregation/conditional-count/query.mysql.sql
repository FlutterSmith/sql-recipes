SELECT
    customer_id,
    COUNT(*) AS orders,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_orders
FROM orders
GROUP BY customer_id
ORDER BY customer_id
