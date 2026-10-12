SELECT
    id,
    regexp_replace(TRIM(raw), '\s+', ' ', 'g') AS cleaned
FROM inputs
ORDER BY id
