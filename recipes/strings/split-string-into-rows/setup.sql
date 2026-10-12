CREATE TABLE posts (
    id   INTEGER PRIMARY KEY,
    tags VARCHAR(100) NOT NULL
);

INSERT INTO posts (id, tags) VALUES
    (1, 'sql,postgres'),
    (2, 'python'),
    (3, 'sql,duckdb,wasm');
