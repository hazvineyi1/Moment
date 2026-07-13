---
name: Cele session creation bug
description: useCreateSession hook requires eventId in mutate call; omitting it causes infinite 400 loop
---

## Rule
`createSession.mutate({ eventId: id, data: { title: '...' } })` — always include `eventId`.

**Why:** The orval-generated `useCreateSession` mutation has signature `{ eventId: number; data: SessionInput }`. Calling it without `eventId` sends `POST /api/events/undefined/sessions` which returns 400. If the `useEffect` doesn't guard against isPending/isError state, this fires every render → infinite loop → permanent "Waking up Cele..." spinner.

**How to apply:**
- Guard session creation with local state: `sessionCreating` (bool) and `sessionError` (bool) so it only fires once.
- Always pass `{ eventId: id, data: {...} }` to the mutate call, never just `{ data: {...} }`.
- Pattern: set `sessionCreating = true` before mutate, `false` in both onSuccess and onError. Check both flags in useEffect guard.
