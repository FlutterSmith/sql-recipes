SELECT
    id,
    JSON_UNQUOTE(JSON_EXTRACT(payload, '$.user')) AS user_name,
    CAST(JSON_EXTRACT(payload, '$.meta.age') AS SIGNED) AS age
FROM events
ORDER BY id
