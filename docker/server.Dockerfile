ARG NODE_IMAGE=node:20-alpine
ARG PNPM_REGISTRY=https://registry.npmmirror.com

FROM ${NODE_IMAGE} AS base
ARG PNPM_REGISTRY
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm config set registry ${PNPM_REGISTRY}

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpm-approve-builds.json .npmrc* ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /root/.cache/pnpm /root/.cache/pnpm
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @mocktrade/shared build && \
    pnpm --filter server build && \
    pnpm deploy --legacy --filter server --prod /prod/server

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /prod/server ./
COPY --from=builder /app/world ./world
RUN mkdir -p uploads
EXPOSE 3001
CMD ["node", "dist/main.js"]
