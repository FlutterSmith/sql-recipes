CREATE TABLE stock_2023 (sku VARCHAR(10) PRIMARY KEY, qty INTEGER NOT NULL);
CREATE TABLE stock_2024 (sku VARCHAR(10) PRIMARY KEY, qty INTEGER NOT NULL);

INSERT INTO stock_2023 (sku, qty) VALUES ('A', 10), ('B', 5), ('C', 2);
INSERT INTO stock_2024 (sku, qty) VALUES ('B', 7), ('C', 0), ('D', 4);
