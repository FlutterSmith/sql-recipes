SELECT
    p.id,
    t.value AS tag
FROM posts AS p
JOIN json_each('["' || replace(p.tags, ',', '","') || '"]') AS t
ORDER BY p.id, tag
