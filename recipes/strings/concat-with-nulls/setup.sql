CREATE TABLE people (
    id     INTEGER PRIMARY KEY,
    first  VARCHAR(50) NOT NULL,
    middle VARCHAR(50),
    last   VARCHAR(50) NOT NULL
);

INSERT INTO people (id, first, middle, last) VALUES
    (1, 'Ada', NULL, 'Lovelace'),
    (2, 'Grace', 'Brewster', 'Hopper'),
    (3, 'Linus', NULL, 'Torvalds');
