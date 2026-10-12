CREATE TABLE profiles (
    id       INTEGER PRIMARY KEY,
    nickname VARCHAR(50)
);

INSERT INTO profiles (id, nickname) VALUES
    (1, 'ada'),
    (2, NULL),
    (3, 'ada'),
    (4, NULL),
    (5, 'bob');
