# Stage 1: Dependencies
FROM node:22-bookworm-slim AS deps
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM deps AS build
COPY . .
RUN pnpm build

# Stage 3: Production (uses Playwright image for Chromium + system deps)
FROM mcr.microsoft.com/playwright:v1.58.0-noble
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3001

CMD node dist/src/worker.js & node dist/src/main.js
