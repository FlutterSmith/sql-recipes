SELECT
    COALESCE(a.sku, b.sku) AS sku,
    a.qty AS qty_2023,
    b.qty AS qty_2024
FROM stock_2023 AS a
FULL OUTER JOIN stock_2024 AS b ON b.sku = a.sku
ORDER BY sku
