SELECT p.id, p.name
FROM products AS p
WHERE p.id IN (
    SELECT oi.product_id
    FROM order_items AS oi
    JOIN orders AS o ON o.id = oi.order_id
    WHERE o.customer_id = 1
    EXCEPT
    SELECT oi.product_id
    FROM order_items AS oi
    JOIN orders AS o ON o.id = oi.order_id
    WHERE o.customer_id = 3
)
ORDER BY p.id
