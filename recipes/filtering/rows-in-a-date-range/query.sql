SELECT id, ordered_at
FROM orders
WHERE ordered_at >= '2024-03-01'
  AND ordered_at <  '2024-04-01'
ORDER BY ordered_at
