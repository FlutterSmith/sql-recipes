SELECT
    name,
    TIMESTAMPDIFF(YEAR, hired_on, DATE '2024-06-30') AS years
FROM employees
ORDER BY id
