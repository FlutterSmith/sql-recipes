WITH ranked AS (
    SELECT
        category,
        name,
        price,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC, name) AS rn
    FROM products
)
SELECT category, name, price, rn AS place
FROM ranked
WHERE rn <= 2
ORDER BY category, rn
