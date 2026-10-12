SELECT
    id,
    printf('INV-%05d', id) AS invoice_no
FROM orders
ORDER BY id
