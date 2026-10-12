WITH order_totals AS (
    SELECT order_id, SUM(quantity * unit_price) AS total
    FROM order_items
    GROUP BY order_id
),
customer_totals AS (
    SELECT o.customer_id, SUM(t.total) AS spent
    FROM orders AS o
    JOIN order_totals AS t ON t.order_id = o.id
    GROUP BY o.customer_id
)
SELECT
    c.id,
    c.name,
    COALESCE(ct.spent, 0) AS spent
FROM customers AS c
LEFT JOIN customer_totals AS ct ON ct.customer_id = c.id
ORDER BY c.id
