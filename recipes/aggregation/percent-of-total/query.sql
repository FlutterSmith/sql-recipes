SELECT
    p.category,
    SUM(oi.quantity * oi.unit_price) AS revenue,
    ROUND(100.0 * SUM(oi.quantity * oi.unit_price)
          / SUM(SUM(oi.quantity * oi.unit_price)) OVER (), 1) AS pct
FROM order_items AS oi
JOIN orders AS o ON o.id = oi.order_id
JOIN products AS p ON p.id = oi.product_id
WHERE o.status = 'paid'
GROUP BY p.category
ORDER BY revenue DESC
