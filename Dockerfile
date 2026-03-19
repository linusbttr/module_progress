# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# node:sqlite is stable in Node 24 – no flag needed at build time
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:24-alpine AS runner

RUN addgroup -S nuxt && adduser -S nuxt -G nuxt

WORKDIR /app

COPY --from=builder --chown=nuxt:nuxt /app/.output ./

RUN mkdir -p /data && chown nuxt:nuxt /data
VOLUME ["/data"]

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NITRO_PRESET=node-server

USER nuxt

EXPOSE 3000

# node:sqlite is stable in Node 24 – no --experimental-sqlite flag needed
CMD ["node", "server/index.mjs"]
