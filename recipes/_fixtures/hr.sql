-- A small company: three departments and nine employees who report to each
-- other. Every recipe that says `fixture: hr` starts from exactly these rows.

CREATE TABLE departments (
    id   INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE employees (
    id            INTEGER PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    department_id INTEGER       NOT NULL,
    manager_id    INTEGER,
    salary        DECIMAL(10,2) NOT NULL,
    hired_on      DATE          NOT NULL
);

INSERT INTO departments (id, name) VALUES
    (1, 'Engineering'),
    (2, 'Sales'),
    (3, 'Support');

INSERT INTO employees (id, name, department_id, manager_id, salary, hired_on) VALUES
    (1, 'Nadia',  1, NULL, 9800.00, '2019-03-01'),
    (2, 'Omar',   1, 1,    7200.00, '2020-06-15'),
    (3, 'Priya',  1, 1,    7200.00, '2021-01-10'),
    (4, 'Quentin',1, 2,    5100.00, '2022-09-01'),
    (5, 'Rosa',   2, 1,    6400.00, '2020-02-20'),
    (6, 'Sam',    2, 5,    4300.00, '2021-11-05'),
    (7, 'Tariq',  2, 5,    4300.00, '2023-04-17'),
    (8, 'Uma',    3, 1,    3900.00, '2022-01-03'),
    (9, 'Viktor', 3, 8,    3500.00, '2023-08-28');
