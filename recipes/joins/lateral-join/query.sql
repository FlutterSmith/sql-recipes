SELECT
    c.id,
    c.name,
    recent.order_id,
    recent.ordered_at
FROM customers AS c
LEFT JOIN LATERAL (
    SELECT o.id AS order_id, o.ordered_at
    FROM orders AS o
    WHERE o.customer_id = c.id
    ORDER BY o.ordered_at DESC
    LIMIT 2
) AS recent ON TRUE
ORDER BY c.id, recent.ordered_at DESC
