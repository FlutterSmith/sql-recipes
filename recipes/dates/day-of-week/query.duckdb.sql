SELECT
    isodow(ordered_at) AS weekday,
    COUNT(*) AS orders
FROM orders
GROUP BY isodow(ordered_at)
ORDER BY weekday
