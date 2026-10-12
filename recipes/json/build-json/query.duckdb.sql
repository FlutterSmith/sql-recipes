SELECT json_group_array(json_object('id', id, 'name', name)) AS customers
FROM (SELECT id, name FROM customers ORDER BY id)
