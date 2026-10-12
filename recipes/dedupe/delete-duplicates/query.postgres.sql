DELETE FROM signups AS s
USING signups AS keep
WHERE keep.email = s.email
  AND keep.id < s.id;

SELECT id, email
FROM signups
ORDER BY id
