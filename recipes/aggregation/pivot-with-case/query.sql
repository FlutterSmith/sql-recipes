SELECT
    customer_id,
    SUM(CASE WHEN status = 'paid'      THEN 1 ELSE 0 END) AS paid,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
    SUM(CASE WHEN status = 'refunded'  THEN 1 ELSE 0 END) AS refunded
FROM orders
GROUP BY customer_id
ORDER BY customer_id
