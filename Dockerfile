# syntax=docker/dockerfile:1
FROM node:24-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY . .

# The repo's preinstall guard requires pnpm — satisfied by corepack pnpm.
RUN pnpm install --frozen-lockfile

# Clerk publishable key is inlined into the frontend bundle at build time.
# Railway passes service variables to the build as build args.
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# PORT + BASE_PATH are only required by the (Replit-era) vite config at build time.
ENV NODE_ENV=production
RUN PORT=8080 BASE_PATH=/ pnpm --filter @workspace/celebrate run build

RUN pnpm --filter @workspace/api-server run build

# Express serves the SPA from dist/public
RUN cp -r artifacts/celebrate/dist/public artifacts/api-server/dist/public

EXPOSE 8080
CMD ["sh", "-c", "pnpm --filter @workspace/db run push --force && node --enable-source-maps artifacts/api-server/dist/index.mjs"]
