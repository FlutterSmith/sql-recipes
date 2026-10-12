SELECT
    e.id,
    t.tag
FROM events AS e
JOIN JSON_TABLE(e.payload, '$.tags[*]' COLUMNS (tag VARCHAR(50) PATH '$')) AS t
ORDER BY e.id, t.tag
