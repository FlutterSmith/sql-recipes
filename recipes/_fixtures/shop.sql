-- A small web shop: four customers, six products, eight orders.
-- Every recipe that says `fixture: shop` starts from exactly these rows.

CREATE TABLE customers (
    id         INTEGER PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    country    VARCHAR(2)   NOT NULL,
    created_at DATE         NOT NULL
);

CREATE TABLE products (
    id       INTEGER PRIMARY KEY,
    name     VARCHAR(100)  NOT NULL,
    category VARCHAR(50)   NOT NULL,
    price    DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER     NOT NULL,
    status      VARCHAR(20) NOT NULL,
    ordered_at  TIMESTAMP   NOT NULL
);

CREATE TABLE order_items (
    order_id   INTEGER       NOT NULL,
    product_id INTEGER       NOT NULL,
    quantity   INTEGER       NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

INSERT INTO customers (id, name, email, country, created_at) VALUES
    (1, 'Ada Lovelace',   'ada@example.com',   'GB', '2024-01-05'),
    (2, 'Grace Hopper',   'grace@example.com', 'US', '2024-01-20'),
    (3, 'Linus Torvalds', 'linus@example.com', 'FI', '2024-02-11'),
    (4, 'Margaret Hamilton', 'margaret@example.com', 'US', '2024-03-02');

INSERT INTO products (id, name, category, price) VALUES
    (1, 'Mechanical keyboard', 'hardware', 120.00),
    (2, 'USB-C hub',           'hardware',  39.50),
    (3, 'Monitor arm',         'hardware',  85.00),
    (4, 'SQL course',          'courses',   49.00),
    (5, 'Python course',       'courses',   59.00),
    (6, 'Sticker pack',        'merch',      4.99);

INSERT INTO orders (id, customer_id, status, ordered_at) VALUES
    (1, 1, 'paid',      '2024-02-01 09:15:00'),
    (2, 1, 'paid',      '2024-02-14 18:40:00'),
    (3, 2, 'paid',      '2024-02-20 11:05:00'),
    (4, 3, 'cancelled', '2024-03-03 08:00:00'),
    (5, 3, 'paid',      '2024-03-10 16:30:00'),
    (6, 2, 'refunded',  '2024-03-15 12:00:00'),
    (7, 1, 'paid',      '2024-04-02 10:10:00'),
    (8, 3, 'paid',      '2024-04-21 19:45:00');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 120.00),
    (1, 6, 3,   4.99),
    (2, 4, 1,  49.00),
    (3, 2, 2,  39.50),
    (3, 3, 1,  85.00),
    (4, 5, 1,  59.00),
    (5, 1, 1, 120.00),
    (5, 2, 1,  39.50),
    (6, 4, 1,  49.00),
    (7, 5, 1,  59.00),
    (7, 6, 5,   4.99),
    (8, 3, 2,  85.00);
