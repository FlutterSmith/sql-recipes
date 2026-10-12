CREATE TABLE events (
    id      INTEGER PRIMARY KEY,
    payload TEXT NOT NULL
);

INSERT INTO events (id, payload) VALUES
    (1, '{"user": "ada", "meta": {"age": 36}, "tags": ["login", "web"]}'),
    (2, '{"user": "grace", "meta": {"age": 85}, "tags": ["purchase"]}'),
    (3, '{"user": "linus", "meta": {"age": 54}, "tags": []}');
