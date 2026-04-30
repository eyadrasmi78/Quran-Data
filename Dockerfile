# Multi-stage build keeps the final image small and dev-tools-free.
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
# Prefer the deterministic install when a lockfile exists; fall back otherwise.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev --no-audit --no-fund; fi

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy installed deps + source.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY server ./server
COPY data ./data
COPY docs ./docs

# Drop root privileges. node:*-alpine ships with a non-root `node` user.
RUN chown -R node:node /usr/src/app
USER node

EXPOSE 5000
CMD ["node", "server/server.mjs"]
