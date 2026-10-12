"""Small SQL text helpers: statement splitting and setup adaptation."""

from __future__ import annotations

import re


def split_statements(sql: str) -> list[str]:
    """Split ``sql`` on semicolons that sit outside quotes and comments.

    Good enough for the SQL in this repository: no procedures, no dollar
    quoting. Empty statements and pure comments are dropped.
    """
    out: list[str] = []
    buf: list[str] = []
    i, n = 0, len(sql)
    while i < n:
        ch = sql[i]
        two = sql[i : i + 2]
        if two == "--":
            end = sql.find("\n", i)
            end = n if end == -1 else end
            buf.append(sql[i:end])
            i = end
            continue
        if two == "/*":
            end = sql.find("*/", i + 2)
            end = n if end == -1 else end + 2
            buf.append(sql[i:end])
            i = end
            continue
        if ch in ("'", '"', "`"):
            end = i + 1
            while end < n:
                if sql[end] == ch:
                    if ch == "'" and sql[end : end + 2] == "''":
                        end += 2
                        continue
                    break
                end += 1
            buf.append(sql[i : end + 1])
            i = end + 1
            continue
        if ch == ";":
            out.append("".join(buf))
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    out.append("".join(buf))
    return [s for s in (strip_comments(s).strip() for s in out) if s]


def strip_comments(sql: str) -> str:
    """Remove ``--`` and ``/* */`` comments (used to detect empty statements)."""
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.DOTALL)
    return re.sub(r"--[^\n]*", "", sql)


# Types the portable fixtures use, and what each engine wants instead.
TYPE_MAP: dict[str, dict[str, str]] = {
    "mysql": {"TIMESTAMP": "DATETIME", "TEXT PRIMARY KEY": "VARCHAR(100) PRIMARY KEY"},
}


def adapt_setup(sql: str, dialect: str) -> str:
    """Rewrite the few type names that differ between engines in setup SQL."""
    for src, dst in TYPE_MAP.get(dialect, {}).items():
        sql = re.sub(rf"\b{re.escape(src)}\b", dst, sql)
    return sql
