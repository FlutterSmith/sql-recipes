SELECT id, ordered_at
FROM orders
WHERE (ordered_at, id) > ('2024-02-20 11:05:00', 3)
ORDER BY ordered_at, id
LIMIT 3
