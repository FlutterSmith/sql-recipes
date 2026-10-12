SELECT
    e.id,
    unnest(CAST(e.payload -> '$.tags' AS VARCHAR[])) AS tag
FROM events AS e
ORDER BY e.id, tag
