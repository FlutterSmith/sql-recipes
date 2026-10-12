SELECT
    id,
    CONCAT('INV-', LPAD(CAST(id AS VARCHAR(10)), 5, '0')) AS invoice_no
FROM orders
ORDER BY id
