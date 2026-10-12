SELECT
    read_at,
    value,
    ROUND(AVG(value) OVER (
        ORDER BY read_at
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 2) AS avg_3
FROM readings
WHERE sensor = 'a'
ORDER BY read_at
