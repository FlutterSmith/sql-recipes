WITH RECURSIVE days AS (
    SELECT '2024-01-01' AS day
    UNION ALL
    SELECT date(day, '+1 day')
    FROM days
    WHERE day < '2024-01-09'
)
SELECT
    days.day,
    r.value
FROM days
LEFT JOIN readings AS r
       ON date(r.read_at) = days.day
      AND r.sensor = 'a'
ORDER BY days.day
