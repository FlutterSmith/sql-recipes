SELECT id, name
FROM customers
WHERE LOWER(name) LIKE LOWER('%hamilton%')
ORDER BY id
