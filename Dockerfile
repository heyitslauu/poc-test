# ============================================
# Stage 1: Builder
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Clean previous build
RUN rm -rf dist

# Build the application
RUN pnpm build

# ============================================
# Stage 2: Production Dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ============================================
# Stage 3: Production
# ============================================
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S exfsds && \
    adduser -u 1001 -S exfsds -G exfsds

# Copy dist from builder and node_modules from deps
COPY --from=builder --chown=exfsds:exfsds /app/dist ./dist
COPY --from=builder --chown=exfsds:exfsds /app/deployment ./deployment
COPY --from=deps --chown=exfsds:exfsds /app/node_modules ./node_modules
COPY --from=builder --chown=exfsds:exfsds /app/src/database ./src/database
COPY --from=builder --chown=exfsds:exfsds /app/drizzle.config.ts ./drizzle.config.ts
COPY --chown=exfsds:exfsds .env .

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && \
    chown -R exfsds:exfsds /app/logs && \
    chmod -R 755 /app/logs

USER exfsds

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/src/main.js"]