SELECT a.id AS first_id, b.id AS second_id
FROM profiles AS a
JOIN profiles AS b
  ON a.nickname IS NOT DISTINCT FROM b.nickname
 AND a.id < b.id
ORDER BY a.id, b.id
