INSERT INTO stock (sku, qty)
VALUES ('A', 3), ('C', 7)
ON CONFLICT (sku) DO UPDATE
SET qty = stock.qty + excluded.qty;

SELECT sku, qty
FROM stock
ORDER BY sku
