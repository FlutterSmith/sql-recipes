SELECT
    id,
    REGEXP_REPLACE(TRIM(raw), '\\s+', ' ') AS cleaned
FROM inputs
ORDER BY id
