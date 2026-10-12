SELECT
    split_part(email, '@', 2) AS domain,
    COUNT(*) AS people
FROM contacts
GROUP BY split_part(email, '@', 2)
ORDER BY domain
