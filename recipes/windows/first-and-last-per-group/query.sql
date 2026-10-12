SELECT DISTINCT
    sensor,
    FIRST_VALUE(value) OVER (
        PARTITION BY sensor ORDER BY read_at
    ) AS opening,
    LAST_VALUE(value) OVER (
        PARTITION BY sensor ORDER BY read_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS latest
FROM readings
ORDER BY sensor
