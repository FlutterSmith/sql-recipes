WITH RECURSIVE series AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1
    FROM series
    WHERE n < 5
)
SELECT n, n * n AS square
FROM series
ORDER BY n
