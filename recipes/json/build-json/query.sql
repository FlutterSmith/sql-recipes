SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name) ORDER BY id) AS customers
FROM customers
