SELECT
    SUBSTRING_INDEX(email, '@', -1) AS domain,
    COUNT(*) AS people
FROM contacts
GROUP BY SUBSTRING_INDEX(email, '@', -1)
ORDER BY domain
