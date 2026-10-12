CREATE TABLE stock (
    sku VARCHAR(20) PRIMARY KEY,
    qty INTEGER NOT NULL
);

INSERT INTO stock (sku, qty) VALUES ('A', 10), ('B', 5);
