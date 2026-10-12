SELECT
    name,
    salary,
    NTILE(3) OVER (ORDER BY salary DESC, name) AS band
FROM employees
ORDER BY salary DESC, name
