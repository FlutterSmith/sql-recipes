SELECT
    oi.order_id,
    group_concat(p.name, ', ' ORDER BY p.name) AS products
FROM order_items AS oi
JOIN products AS p ON p.id = oi.product_id
GROUP BY oi.order_id
ORDER BY oi.order_id
