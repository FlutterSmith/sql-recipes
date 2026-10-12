SELECT
    p.id,
    t.tag
FROM posts AS p
CROSS JOIN unnest(string_to_array(p.tags, ',')) AS t(tag)
ORDER BY p.id, t.tag
