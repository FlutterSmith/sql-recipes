CREATE TABLE signups (
    id    INTEGER PRIMARY KEY,
    email VARCHAR(100) NOT NULL
);

INSERT INTO signups (id, email) VALUES
    (1, 'ada@example.com'),
    (2, 'bob@example.com'),
    (3, 'ada@example.com'),
    (4, 'cy@example.com'),
    (5, 'bob@example.com'),
    (6, 'ada@example.com');
