---
name: TSX string apostrophes
description: Apostrophes inside single-quoted JSX/TSX string attributes cause Babel parser errors
---

## Rule
Never write `desc: 'Chef's tables...'` — the apostrophe closes the single-quoted string early.

**Why:** Babel's JSX/TSX parser treats the `'` in "Chef's" as the closing quote of the string, then fails parsing what follows.

**How to apply:**
- For any string containing a contraction or possessive (can't, don't, Chef's, it's), use double quotes: `desc: "Chef's tables..."` or unicode escape `\u2019`.
- When writing large data objects with English text, default all `desc` and `label` values to double-quoted strings to avoid this class of error entirely.
- Run `grep -n "'" file.tsx | grep -v "^[0-9]*:\s*import"` and visually scan for apostrophes inside single-quoted values before saving.
