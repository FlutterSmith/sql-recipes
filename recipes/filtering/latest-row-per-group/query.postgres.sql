SELECT DISTINCT ON (customer_id)
    customer_id,
    id AS order_id,
    ordered_at,
    status
FROM orders
ORDER BY customer_id, ordered_at DESC
