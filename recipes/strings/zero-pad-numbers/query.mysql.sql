SELECT
    id,
    CONCAT('INV-', LPAD(id, 5, '0')) AS invoice_no
FROM orders
ORDER BY id
