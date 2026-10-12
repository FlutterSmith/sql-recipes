CREATE TABLE contacts (
    id    INTEGER PRIMARY KEY,
    email VARCHAR(100) NOT NULL
);

INSERT INTO contacts (id, email) VALUES
    (1, 'ada@example.com'),
    (2, 'grace@mail.example.net'),
    (3, 'linus@example.org'),
    (4, 'margaret@example.com'),
    (5, 'nadia@mail.example.net');
