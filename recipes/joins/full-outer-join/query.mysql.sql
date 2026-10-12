SELECT a.sku, a.qty AS qty_2023, b.qty AS qty_2024
FROM stock_2023 AS a
LEFT JOIN stock_2024 AS b ON b.sku = a.sku
UNION ALL
SELECT b.sku, NULL, b.qty
FROM stock_2024 AS b
LEFT JOIN stock_2023 AS a ON a.sku = b.sku
WHERE a.sku IS NULL
ORDER BY sku
