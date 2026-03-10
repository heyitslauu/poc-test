# ============================================
# Stage 1: Builder
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN rm -rf dist && pnpm build

# ============================================
# Stage 2: Production Dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

# Only production dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ============================================
# Stage 3: Production
# ============================================
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Install CA certificates + wget for healthchecks
RUN apk add --no-cache ca-certificates wget && update-ca-certificates

# Add non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Download Amazon RDS CA cert during build
RUN wget -O /etc/ssl/certs/rds-ca.pem \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Copy application code
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/deployment ./deployment
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/src/database ./src/database
COPY --from=builder --chown=appuser:appgroup /app/drizzle.config.ts ./drizzle.config.ts
COPY --chown=appuser:appgroup --chmod=755 entrypoint.sh /entrypoint.sh

# Make scripts executable
RUN find /app/deployment -type f -name "*.sh" -exec chmod 755 {} \;

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs && chmod -R 755 /app/logs

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/src/main.js"]