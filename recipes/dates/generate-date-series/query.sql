WITH days AS (
    SELECT CAST(d AS DATE) AS day
    FROM generate_series(DATE '2024-01-01', DATE '2024-01-09', INTERVAL '1 day') AS g(d)
)
SELECT
    days.day,
    r.value
FROM days
LEFT JOIN readings AS r
       ON CAST(r.read_at AS DATE) = days.day
      AND r.sensor = 'a'
ORDER BY days.day
