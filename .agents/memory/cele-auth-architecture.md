---
name: Cele auth architecture
description: Multi-user auth approach, per-user event scoping, questionnaire system, and removal of global profile
---

## Auth
- Clerk (Replit-managed), Google + email/password login
- `setupClerkWhitelabelAuth()` already called — keys provisioned
- Tailwind v4 requires `@layer theme, base, clerk, components, utilities;` BEFORE `@import 'tailwindcss'` in index.css
- Vite config needs `tailwindcss({ optimize: false })` to avoid prod CSS breakage
- `clerkPubKey` must use `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` — never raw env var

## Per-user events
- `events` table has `clerk_user_id TEXT NOT NULL DEFAULT ''` — all event queries filter by `eq(eventsTable.clerkUserId, userId)`
- `userId` is extracted from `getAuth(req).userId` in `requireAuth` middleware at `artifacts/api-server/src/middlewares/requireAuth.ts`
- All routes (events, sessions, guests, suggestions, invites, costs, options) use `requireAuth`

## No global profile
- `usersTable` / `profile` routes are defunct — do NOT add profile back
- Per-user context lives in `event.description` using `__HOST_CONTEXT__:` marker
- Cele's system prompt reads host context from event description, not a user table

## Questionnaire system
- `events` table has `questionnaire_token TEXT` (UUID, set on creation)
- Public routes: `GET /api/q/:token` (event info) + `POST /api/q/:token` (submit answers)
- Answers stored in `event.description` as `__CELEBRANT__:{...json...}` marker
- Frontend: `QuestionnairePage` at `/q/:token` — no auth required
- When "planning for someone else" is selected in NewEvent, celebrant name is stored in description; questionnaire link shown in EventHub after creation

## NewEvent flow (7 steps)
- Step 0: Who is this for? (myself / someone else / together) — required
- Step 1: Occasion (optional)
- Step 2: Experiences (multi)
- Step 3: Vibe (multi)
- Step 4: Group makeup
- Step 5: Must-haves
- Step 6: Last details + submit

**Why:** User said different people use the app (no global profile), each session is per-user, and planner may be organising for someone else who needs their own questionnaire link.
