CREATE TABLE bookings (
    id        INTEGER PRIMARY KEY,
    starts_on DATE NOT NULL,
    ends_on   DATE NOT NULL
);

INSERT INTO bookings (id, starts_on, ends_on) VALUES
    (1, '2024-01-10', '2024-01-15'),
    (2, '2024-01-14', '2024-01-20'),
    (3, '2024-01-25', '2024-01-30'),
    (4, '2024-02-01', '2024-02-05');
