WITH RECURSIVE chain AS (
    SELECT id, name, CAST(name AS CHAR(200)) AS path
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, CONCAT(c.path, ' > ', e.name)
    FROM employees AS e
    JOIN chain AS c ON e.manager_id = c.id
)
SELECT name, path
FROM chain
ORDER BY path
