DELETE FROM signups
WHERE id NOT IN (
    SELECT keep_id
    FROM (SELECT MIN(id) AS keep_id FROM signups GROUP BY email) AS keep
);

SELECT id, email
FROM signups
ORDER BY id
