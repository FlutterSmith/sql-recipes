SELECT
    email,
    COUNT(*) AS copies,
    MIN(id) AS keep_id
FROM signups
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email
