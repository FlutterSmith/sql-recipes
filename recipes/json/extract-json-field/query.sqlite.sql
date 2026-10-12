SELECT
    id,
    payload ->> '$.user' AS user_name,
    CAST(payload ->> '$.meta.age' AS INTEGER) AS age
FROM events
ORDER BY id
