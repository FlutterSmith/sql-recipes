DELETE s
FROM signups AS s
JOIN signups AS keep
  ON keep.email = s.email
 AND keep.id < s.id;

SELECT id, email
FROM signups
ORDER BY id
