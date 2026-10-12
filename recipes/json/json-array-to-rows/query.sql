SELECT
    e.id,
    t.tag
FROM events AS e
CROSS JOIN jsonb_array_elements_text(CAST(e.payload AS jsonb) -> 'tags') AS t(tag)
ORDER BY e.id, t.tag
