PIVOT orders
ON status IN ('paid', 'cancelled', 'refunded')
USING COUNT(*)
GROUP BY customer_id
ORDER BY customer_id
