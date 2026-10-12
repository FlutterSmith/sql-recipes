WITH RECURSIVE days AS (
    SELECT DATE '2024-01-01' AS day
    UNION ALL
    SELECT day + INTERVAL 1 DAY
    FROM days
    WHERE day < DATE '2024-01-09'
)
SELECT
    days.day,
    r.value
FROM days
LEFT JOIN readings AS r
       ON DATE(r.read_at) = days.day
      AND r.sensor = 'a'
ORDER BY days.day
