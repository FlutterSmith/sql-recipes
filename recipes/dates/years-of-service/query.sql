SELECT
    name,
    CAST(EXTRACT(YEAR FROM age(DATE '2024-06-30', hired_on)) AS INTEGER) AS years
FROM employees
ORDER BY id
