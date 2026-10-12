UPDATE products AS p
JOIN price_updates AS u ON u.product_id = p.id
SET p.price = u.new_price;

SELECT id, name, price
FROM products
ORDER BY id
