CREATE TABLE price_updates (
    product_id INTEGER PRIMARY KEY,
    new_price  DECIMAL(10,2) NOT NULL
);

INSERT INTO price_updates (product_id, new_price) VALUES (2, 35.00), (6, 5.49);
