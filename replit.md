# Cele — Celebration Planner

A warm, AI-powered celebration planner that acts as your personal advocate. Plan destination weddings, birthdays, vacations, funerals, reunions, and any gathering — with conversational AI, personality-based guest matching, global venue discovery, and WhatsApp-ready invites.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/celebrate run dev` — run the frontend (served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI Integration for OpenAI

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, Wouter, Tailwind CSS, shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- AI: OpenAI via Replit AI Integrations (gpt-5.4-mini)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, events, planning_sessions, messages, guests, suggestions, invites)
- `artifacts/api-server/src/routes/` — Express route handlers (profile, events, sessions, guests, suggestions, invites)
- `artifacts/api-server/src/lib/ai.ts` — OpenAI helper (chatWithAI, generateJSON)
- `artifacts/celebrate/src/` — React frontend (pages/, components/)

## Architecture decisions

- Single-user app: profile is the one row in the `users` table (created automatically on first GET /profile).
- All AI calls use gpt-5.4-mini via Replit's managed OpenAI integration — no user API key required.
- WhatsApp integration uses the wa.me deep-link standard (no API key needed).
- Personality pairings use AI to analyze guest personality JSON blobs and produce roommate/travel buddy/seating suggestions.
- Suggestions are persisted in the DB after AI generation so users can save/unsave them.

## Product

- Dashboard: active celebrations at a glance with completion status
- New Event Wizard: multi-step flow for any celebration type
- Event Hub: per-event overview with completion meter and next-step checklist
- Planning Chat: back-and-forth AI conversation that helps clarify and ideate
- Guest List: RSVP tracking, personality badges, AI pairing suggestions
- Discover: AI-generated global venue/activity suggestions, saveable
- Invites: AI-generated invite text in 4 styles with one-click WhatsApp sharing
- Profile: user preferences that personalize all AI recommendations

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The `/events/:eventId/guests/pairings` route must come BEFORE `/events/:eventId/guests/:guestId` in Express or "pairings" gets caught as a guest ID.
- DB push with Drizzle is idempotent in dev; safe to re-run after schema changes.
- After any OpenAPI spec change, run codegen before touching generated types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
