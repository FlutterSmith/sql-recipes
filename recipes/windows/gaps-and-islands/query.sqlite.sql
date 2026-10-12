WITH numbered AS (
    SELECT
        sensor,
        date(read_at) AS day,
        ROW_NUMBER() OVER (PARTITION BY sensor ORDER BY read_at) AS rn
    FROM readings
),
islands AS (
    SELECT sensor, day, date(day, '-' || rn || ' days') AS island
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
