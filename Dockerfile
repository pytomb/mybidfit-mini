# MyBidFit Production Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production && \
    cd frontend && npm ci

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Remove frontend node_modules to save space
RUN rm -rf frontend/node_modules

# Production stage
FROM node:20-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mybidfit -u 1001

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=mybidfit:nodejs /app/src ./src
COPY --from=builder --chown=mybidfit:nodejs /app/frontend/dist ./frontend/dist
COPY --from=builder --chown=mybidfit:nodejs /app/database ./database
COPY --from=builder --chown=mybidfit:nodejs /app/test ./test

# Create logs directory
RUN mkdir -p /app/logs && chown -R mybidfit:nodejs /app/logs

# Security hardening
RUN apk add --no-cache dumb-init && \
    chown -R mybidfit:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER mybidfit

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { \
        if (res.statusCode === 200) process.exit(0); else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]

# Multi-architecture build support
# docker buildx build --platform linux/amd64,linux/arm64 -t mybidfit:latest .

# Build arguments for customization
ARG NODE_ENV=production
ARG APP_VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

# Labels for better image management
LABEL \
    org.label-schema.schema-version="1.0" \
    org.label-schema.build-date=$BUILD_DATE \
    org.label-schema.name="mybidfit" \
    org.label-schema.description="MyBidFit AI-Powered Procurement Platform" \
    org.label-schema.version=$APP_VERSION \
    org.label-schema.vcs-ref=$VCS_REF \
    org.label-schema.vcs-url="https://github.com/mybidfit/mybidfit" \
    org.label-schema.vendor="MyBidFit Inc." \
    maintainer="MyBidFit DevOps <devops@mybidfit.com>"

# Environment variables
ENV NODE_ENV=$NODE_ENV \
    APP_VERSION=$APP_VERSION \
    PORT=3001