SELECT id, ordered_at
FROM orders
ORDER BY ordered_at, id
LIMIT 3 OFFSET 3
