SELECT id, starts_on, ends_on
FROM bookings
WHERE starts_on < '2024-01-26'
  AND ends_on   > '2024-01-14'
ORDER BY starts_on
