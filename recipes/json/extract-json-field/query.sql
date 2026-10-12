SELECT
    id,
    CAST(payload AS jsonb) ->> 'user' AS user_name,
    CAST(CAST(payload AS jsonb) -> 'meta' ->> 'age' AS INTEGER) AS age
FROM events
ORDER BY id
