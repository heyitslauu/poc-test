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

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ============================================
# Stage 3: Production
# ============================================
FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV RUNTIME_ENV=true

WORKDIR /app

# Install CA certificates + wget for healthchecks
RUN apk add --no-cache ca-certificates wget && update-ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Create directories for logs and certs
RUN mkdir -p /app/logs /app/certs && \
    chown -R appuser:appgroup /app/logs /app/certs && \
    chmod -R 700 /app/certs /app/logs

# Copy application code with correct ownership
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/deployment ./deployment
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/src/database ./src/database
COPY --from=builder --chown=appuser:appgroup /app/drizzle.config.ts ./drizzle.config.ts
COPY ./app/certs/global-bundle.pem /app/certs/global-bundle.pem
# Make all deployment scripts executable
RUN find /app/deployment -type f -name "*.sh" -exec chmod 755 {} \;

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 3000

# Update this on each service-stack to match the service name for healthchecks
ENV SERVICE_NAME=fsds-api

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD sh -c 'wget -qO- http://localhost:3000/${SERVICE_NAME:+$SERVICE_NAME/}health || exit 1'

CMD ["node", "dist/src/main.js"]