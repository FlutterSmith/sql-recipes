SELECT
    read_at,
    value,
    LAG(value) OVER (PARTITION BY sensor ORDER BY read_at) AS previous,
    value - LAG(value) OVER (PARTITION BY sensor ORDER BY read_at) AS delta
FROM readings
WHERE sensor = 'a'
ORDER BY read_at
