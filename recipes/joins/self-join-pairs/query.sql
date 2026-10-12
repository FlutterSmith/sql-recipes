SELECT
    a.category,
    a.name AS first,
    b.name AS second
FROM products AS a
JOIN products AS b
  ON b.category = a.category
 AND b.id > a.id
ORDER BY a.category, a.id, b.id
