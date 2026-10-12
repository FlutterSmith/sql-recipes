SELECT n, n * n AS square
FROM generate_series(1, 5) AS s(n)
ORDER BY n
