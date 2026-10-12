SELECT
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC, name) AS row_num,
    RANK()       OVER (ORDER BY salary DESC) AS rnk,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense
FROM employees
ORDER BY salary DESC, name
