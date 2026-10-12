-- Readings from two sensors, one every day in early 2024, with a gap.
-- Every recipe that says `fixture: sensors` starts from exactly these rows.

CREATE TABLE readings (
    sensor   VARCHAR(10)   NOT NULL,
    read_at  TIMESTAMP     NOT NULL,
    value    DECIMAL(6,1)  NOT NULL,
    PRIMARY KEY (sensor, read_at)
);

INSERT INTO readings (sensor, read_at, value) VALUES
    ('a', '2024-01-01 00:00:00', 20.0),
    ('a', '2024-01-02 00:00:00', 21.5),
    ('a', '2024-01-03 00:00:00', 19.0),
    ('a', '2024-01-04 00:00:00', 22.0),
    ('a', '2024-01-05 00:00:00', 23.5),
    ('a', '2024-01-08 00:00:00', 18.0),
    ('a', '2024-01-09 00:00:00', 18.5),
    ('b', '2024-01-01 00:00:00', 30.0),
    ('b', '2024-01-02 00:00:00', 31.0),
    ('b', '2024-01-03 00:00:00', 29.5),
    ('b', '2024-01-05 00:00:00', 33.0),
    ('b', '2024-01-06 00:00:00', 32.0);
