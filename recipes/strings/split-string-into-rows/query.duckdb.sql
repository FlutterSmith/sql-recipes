SELECT
    p.id,
    unnest(string_split(p.tags, ',')) AS tag
FROM posts AS p
ORDER BY p.id, tag
