SELECT
    id,
    replace(replace(replace(TRIM(raw), ' ', '<>'), '><', ''), '<>', ' ') AS cleaned
FROM inputs
ORDER BY id
