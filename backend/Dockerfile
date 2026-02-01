# ============================================
# NFTicket Protocol Backend Dockerfile
# Multi-stage build for production deployment
# ============================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Compile smart contracts
RUN npm run compile

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nfticket -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy compiled artifacts from builder
COPY --from=builder /app/artifacts ./artifacts
COPY --from=builder /app/cache ./cache

# Copy API and services
COPY api ./api
COPY services ./services
COPY prisma ./prisma

# Copy contracts (for ABI reference)
COPY contracts ./contracts

# Set ownership to non-root user
RUN chown -R nfticket:nodejs /app

# Switch to non-root user
USER nfticket

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the API server
CMD ["node", "api/server.js"]
