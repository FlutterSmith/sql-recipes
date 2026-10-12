WITH ranked AS (
    SELECT
        customer_id,
        id AS order_id,
        ordered_at,
        status,
        ROW_NUMBER() OVER (
            PARTITION BY customer_id
            ORDER BY ordered_at DESC
        ) AS rn
    FROM orders
)
SELECT customer_id, order_id, ordered_at, status
FROM ranked
WHERE rn = 1
ORDER BY customer_id
