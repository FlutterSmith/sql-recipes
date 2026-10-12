UPDATE products
SET price = u.new_price
FROM price_updates AS u
WHERE u.product_id = products.id;

SELECT id, name, price
FROM products
ORDER BY id
