SELECT
    WEEKDAY(ordered_at) + 1 AS weekday,
    COUNT(*) AS orders
FROM orders
GROUP BY WEEKDAY(ordered_at) + 1
ORDER BY weekday
