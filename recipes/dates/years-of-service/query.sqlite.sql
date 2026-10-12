SELECT
    name,
    (strftime('%Y', '2024-06-30') - strftime('%Y', hired_on))
      - (strftime('%m-%d', '2024-06-30') < strftime('%m-%d', hired_on)) AS years
FROM employees
ORDER BY id
