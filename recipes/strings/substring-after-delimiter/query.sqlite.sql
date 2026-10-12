SELECT
    substr(email, instr(email, '@') + 1) AS domain,
    COUNT(*) AS people
FROM contacts
GROUP BY substr(email, instr(email, '@') + 1)
ORDER BY domain
