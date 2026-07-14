---
name: Non-ASCII characters in Edit tool
description: The Edit tool corrupts files when old_string or new_string contains non-ASCII characters like £, em-dashes in regex, etc.
---

## Rule
Never use the Edit tool when the old_string or new_string contains non-ASCII characters (£, €, —, etc.) in a code context (e.g. inside a regex, string literal, or comment that will be parsed).

**Why:** The Edit tool encodes non-ASCII bytes inconsistently when writing back to the file, causing unterminated string constants and parse errors that compound with each retry.

**How to apply:**
- For any replacement involving non-ASCII characters in code, use a Python script via ShellExec instead.
- In the Python script, use unicode escapes (`\u00a3` for £) inside string literals to keep the script itself ASCII-safe.
- If the target value needs the literal character in the output file, write it via `chr(0x00a3)` or embed it directly in the Python string (Python handles UTF-8 correctly via `open(..., encoding='utf-8')`).
- If the corrupted file accumulates multiple broken copies, `git stash -- <path>` to restore then re-apply via Python.
