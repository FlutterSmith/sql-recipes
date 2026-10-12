SELECT
    e.id,
    t.value AS tag
FROM events AS e
JOIN json_each(e.payload, '$.tags') AS t
ORDER BY e.id, tag
