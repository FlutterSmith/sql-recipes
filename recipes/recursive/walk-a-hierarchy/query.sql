WITH RECURSIVE reports AS (
    SELECT id, name, 0 AS depth
    FROM employees
    WHERE id = 1
    UNION ALL
    SELECT e.id, e.name, r.depth + 1
    FROM employees AS e
    JOIN reports AS r ON e.manager_id = r.id
)
SELECT id, name, depth
FROM reports
ORDER BY depth, id
