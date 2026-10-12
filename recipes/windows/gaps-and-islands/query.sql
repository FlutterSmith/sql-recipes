WITH numbered AS (
    SELECT
        sensor,
        CAST(read_at AS DATE) AS day,
        ROW_NUMBER() OVER (PARTITION BY sensor ORDER BY read_at) AS rn
    FROM readings
),
islands AS (
    SELECT sensor, day, day - CAST(rn AS INTEGER) AS island
    FROM numbered
)
SELECT
    sensor,
    MIN(day) AS streak_start,
    MAX(day) AS streak_end,
    COUNT(*) AS days
FROM islands
GROUP BY sensor, island
ORDER BY sensor, streak_start
