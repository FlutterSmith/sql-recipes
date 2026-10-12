SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name)) AS customers
FROM (SELECT id, name FROM customers ORDER BY id) AS ordered
