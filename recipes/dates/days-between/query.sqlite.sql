SELECT
    c.name,
    CAST(julianday(MIN(o.ordered_at)) - julianday(c.created_at) AS INTEGER)
        AS days_to_first_order
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.name, c.created_at
ORDER BY c.id
