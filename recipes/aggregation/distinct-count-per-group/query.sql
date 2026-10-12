SELECT
    o.customer_id,
    COUNT(DISTINCT oi.product_id) AS products
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
GROUP BY o.customer_id
ORDER BY o.customer_id
