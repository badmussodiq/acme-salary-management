# syntax=docker/dockerfile:1.7
# Build context is the repository root (the pnpm workspace).
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/web-utils/package.json packages/web-utils/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter "@acme/web..."

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY packages/web-utils packages/web-utils
COPY apps/web apps/web
RUN pnpm --filter @acme/contracts build && pnpm --filter @acme/web build

FROM node:24-alpine AS node-binary

FROM alpine:3.23 AS runtime
RUN apk add --no-cache libstdc++ \
    && addgroup -S app \
    && adduser -S -G app -H -s /sbin/nologin app
COPY --from=node-binary /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "apps/web/server.js"]
