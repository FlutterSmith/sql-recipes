INSERT IGNORE INTO stock (sku, qty)
VALUES ('B', 99), ('C', 1);

SELECT sku, qty
FROM stock
ORDER BY sku
