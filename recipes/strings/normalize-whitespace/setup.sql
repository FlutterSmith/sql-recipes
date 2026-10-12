CREATE TABLE inputs (
    id  INTEGER PRIMARY KEY,
    raw VARCHAR(100) NOT NULL
);

INSERT INTO inputs (id, raw) VALUES
    (1, '  hello   world '),
    (2, 'one  two    three'),
    (3, 'tidy');
