# Deploying Moment on Railway

The app runs as a **single Railway service**: Express serves the API at `/api`
and the built React SPA at `/`.

## Services

1. **Postgres** — add Railway's Postgres plugin. It provides `DATABASE_URL`.
2. **Web** — this repo, built from `Dockerfile`.

## Variables (Web service)

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | runtime | Reference the Postgres service: `${{Postgres.DATABASE_URL}}` |
| `PORT` | runtime | Railway injects this automatically |
| `CLERK_SECRET_KEY` | runtime | From the Clerk dashboard (`sk_...`) |
| `CLERK_PUBLISHABLE_KEY` | runtime | From the Clerk dashboard (`pk_...`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | **build + runtime** | Same `pk_...` value; inlined into the frontend bundle at build time |
| `OPENAI_API_KEY` | runtime | Standard OpenAI key |
| `OPENAI_BASE_URL` | optional | Only if proxying OpenAI |

## Schema

`drizzle-kit push --force` runs on every start, so the schema is applied
automatically on first boot.

## Clerk setup

In the Clerk dashboard, add the Railway domain (e.g. `moment-production.up.railway.app`)
to the allowed origins / application domains.

## Health

`GET /api/healthz` → `{"status":"ok"}`
