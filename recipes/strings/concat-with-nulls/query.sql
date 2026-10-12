SELECT
    id,
    CONCAT_WS(' ', first, middle, last) AS full_name
FROM people
ORDER BY id
