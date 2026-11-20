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
    pnpm install --frozen-lockfile --ignore-scripts --filter "@acme/api..."

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @acme/contracts build && pnpm --filter @acme/api build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter @acme/api deploy --legacy --prod --ignore-scripts /out/api

FROM node:24-alpine AS node-binary

FROM alpine:3.23 AS runtime
RUN apk add --no-cache libstdc++ \
    && addgroup -S app \
    && adduser -S -G app -H -s /sbin/nologin app
COPY --from=node-binary /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=app:app /out/api ./
USER app
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3001/api/v1/health/live || exit 1
CMD ["node", "dist/main.js"]
