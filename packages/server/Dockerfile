FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/
RUN pnpm install --filter @btc-dashboard/server --frozen-lockfile
EXPOSE 3000
CMD ["pnpm", "--filter", "@btc-dashboard/server", "dev"]
