SELECT
    (strftime('%w', ordered_at) + 6) % 7 + 1 AS weekday,
    COUNT(*) AS orders
FROM orders
GROUP BY (strftime('%w', ordered_at) + 6) % 7 + 1
ORDER BY weekday
