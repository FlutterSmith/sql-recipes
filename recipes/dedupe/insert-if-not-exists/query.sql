INSERT INTO stock (sku, qty)
VALUES ('B', 99), ('C', 1)
ON CONFLICT (sku) DO NOTHING;

SELECT sku, qty
FROM stock
ORDER BY sku
