SELECT
    p.id,
    t.tag
FROM posts AS p
JOIN JSON_TABLE(
    CONCAT('["', REPLACE(p.tags, ',', '","'), '"]'),
    '$[*]' COLUMNS (tag VARCHAR(50) PATH '$')
) AS t
ORDER BY p.id, t.tag
