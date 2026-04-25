FROM node:22-alpine AS base
RUN corepack enable

FROM base AS installer
WORKDIR /workspace
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/frontend/package.json ./packages/frontend/package.json
RUN pnpm install --frozen-lockfile

FROM installer AS builder
COPY packages/ ./packages/
RUN pnpm --filter @watchenv/frontend build
RUN pnpm --filter @watchenv/backend build
RUN pnpm --filter @watchenv/backend deploy --prod /deploy

FROM base AS runner
WORKDIR /app
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /workspace/packages/backend/dist ./dist
COPY --from=builder /workspace/packages/frontend/dist/frontend/browser ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
