"""One adapter per database engine, all with the same tiny interface."""

from __future__ import annotations

import datetime as dt
import json
import os
import re
import sqlite3
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from decimal import Decimal
from typing import Any, Protocol

from cook.sql import adapt_setup, split_statements

Row = dict[str, Any]

DIALECTS = ("sqlite", "postgres", "mysql", "duckdb")
LABELS = {
    "sqlite": "SQLite",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "duckdb": "DuckDB",
}


class Engine(Protocol):
    """What the runner needs from a database."""

    dialect: str

    def version(self) -> str: ...

    def run(self, setup: str, query: str) -> list[Row]:
        """Run ``setup`` then ``query`` in a fresh schema; return the last result."""
        ...


def normalize(value: Any) -> Any:
    """Make values from different drivers comparable and JSON-serialisable."""
    if isinstance(value, bool):
        return value
    if isinstance(value, Decimal):
        value = float(value)
    if isinstance(value, float):
        rounded = round(value, 6)
        return (
            int(rounded)
            if rounded == int(rounded) and "e" not in repr(rounded)
            else rounded
        )
    if isinstance(value, dt.datetime):
        return value.replace(tzinfo=None).isoformat(sep=" ", timespec="seconds")
    if isinstance(value, dt.date | dt.time):
        return value.isoformat()
    if isinstance(value, dt.timedelta):
        return value.total_seconds()
    if isinstance(value, bytes | bytearray | memoryview):
        return bytes(value).decode("utf-8", "replace")
    if isinstance(value, list | tuple):
        return [normalize(v) for v in value]
    if isinstance(value, dict):
        return {k: normalize(v) for k, v in value.items()}
    if isinstance(value, str):
        # Engines that store JSON as text (SQLite, MySQL) hand it back as a string.
        if value[:1] in "[{" and value[-1:] in "]}":
            try:
                return normalize(json.loads(value))
            except ValueError:
                return value
        # Timestamps come back as text from SQLite.
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?", value):
            return value.replace("T", " ")[:19]
        return value
    return value


def rows_from_cursor(columns: list[str], rows: list[Any]) -> list[Row]:
    return [
        {c.lower(): normalize(v) for c, v in zip(columns, r, strict=True)} for r in rows
    ]


class SQLite:
    """In-memory SQLite, from the standard library."""

    dialect = "sqlite"

    def version(self) -> str:
        return sqlite3.sqlite_version

    def run(self, setup: str, query: str) -> list[Row]:
        con = sqlite3.connect(":memory:")
        try:
            con.executescript(adapt_setup(setup, self.dialect))
            cur = con.cursor()
            for statement in split_statements(query):
                cur.execute(statement)
            columns = [d[0] for d in cur.description or []]
            return rows_from_cursor(columns, cur.fetchall())
        finally:
            con.close()


class DuckDB:
    """In-memory DuckDB."""

    dialect = "duckdb"

    def version(self) -> str:
        import duckdb

        return str(duckdb.__version__)

    def run(self, setup: str, query: str) -> list[Row]:
        import duckdb

        con = duckdb.connect(":memory:")
        try:
            for statement in split_statements(adapt_setup(setup, self.dialect)):
                con.execute(statement)
            cur = con
            for statement in split_statements(query):
                cur = con.execute(statement)
            columns = [d[0] for d in cur.description or []]
            return rows_from_cursor(columns, cur.fetchall())
        finally:
            con.close()


class Postgres:
    """Each run gets its own schema, dropped afterwards."""

    dialect = "postgres"

    def __init__(self, url: str) -> None:
        self.url = url

    @contextmanager
    def _connect(self) -> Iterator[Any]:
        import psycopg

        with psycopg.connect(self.url, autocommit=True) as con:
            yield con

    def version(self) -> str:
        with self._connect() as con:
            text = con.execute("select version()").fetchone()[0]
        match = re.search(r"PostgreSQL (\d+(?:\.\d+)?)", text)
        return match.group(1) if match else text

    def run(self, setup: str, query: str) -> list[Row]:
        schema = f"recipe_{uuid.uuid4().hex[:8]}"
        with self._connect() as con:
            con.execute(f"create schema {schema}")
            try:
                con.execute(f"set search_path to {schema}")
                for statement in split_statements(adapt_setup(setup, self.dialect)):
                    con.execute(statement)
                cur = con.cursor()
                for statement in split_statements(query):
                    cur.execute(statement)
                columns = [d.name for d in cur.description or []]
                return rows_from_cursor(columns, cur.fetchall())
            finally:
                con.execute(f"drop schema {schema} cascade")


class MySQL:
    """Each run gets its own database, dropped afterwards."""

    dialect = "mysql"

    def __init__(self, url: str) -> None:
        # mysql://user:password@host:port or mysql://user@/path/to/socket
        match = re.fullmatch(
            r"mysql://([^:@/]+)(?::([^@]*))?@([^:/]*)(?::(\d+))?(/.*)?", url
        )
        if not match:
            raise ValueError(f"unreadable MYSQL_URL {url!r}")
        user, password, host, port, socket = match.groups()
        self.params: dict[str, Any] = {"user": user, "password": password or ""}
        if socket:
            self.params["unix_socket"] = socket
        else:
            self.params["host"] = host or "127.0.0.1"
            self.params["port"] = int(port or 3306)

    @contextmanager
    def _connect(self) -> Iterator[Any]:
        import pymysql

        con = pymysql.connect(**self.params, autocommit=True)
        try:
            yield con
        finally:
            con.close()

    def version(self) -> str:
        with self._connect() as con, con.cursor() as cur:
            cur.execute("select version()")
            text = str(cur.fetchone()[0])
        label = "MariaDB" if "MariaDB" in text else "MySQL"
        number = text.split("-")[0]
        return number if label == "MySQL" else f"{number} ({label})"

    def run(self, setup: str, query: str) -> list[Row]:
        db = f"recipe_{uuid.uuid4().hex[:8]}"
        with self._connect() as con, con.cursor() as cur:
            cur.execute(f"create database {db}")
            try:
                cur.execute(f"use {db}")
                for statement in split_statements(adapt_setup(setup, self.dialect)):
                    cur.execute(statement)
                for statement in split_statements(query):
                    cur.execute(statement)
                columns = [d[0] for d in cur.description or []]
                return rows_from_cursor(columns, list(cur.fetchall()))
            finally:
                cur.execute(f"drop database {db}")


def available(only: set[str] | None = None) -> dict[str, Engine]:
    """The engines this machine can reach, from the environment."""
    engines: dict[str, Engine] = {"sqlite": SQLite(), "duckdb": DuckDB()}
    if url := os.environ.get("PGURL"):
        engines["postgres"] = Postgres(url)
    if url := os.environ.get("MYSQL_URL"):
        engines["mysql"] = MySQL(url)
    if only:
        engines = {k: v for k, v in engines.items() if k in only}
    return {d: engines[d] for d in DIALECTS if d in engines}
