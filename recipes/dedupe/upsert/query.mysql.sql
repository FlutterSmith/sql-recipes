INSERT INTO stock (sku, qty)
VALUES ('A', 3), ('C', 7)
ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty);

SELECT sku, qty
FROM stock
ORDER BY sku
