# Dockerfile for the main Triven app
FROM node:18-alpine

# Install dumb-init and curl for proper signal handling and health checks
RUN apk add --no-cache dumb-init curl bash

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && adduser -S remix -u 1001

# Create app directory and set ownership
WORKDIR /app
RUN chown remix:nodejs /app

# Switch to non-root user for dependency installation
USER remix

# Copy package files
COPY --chown=remix:nodejs package.json bun.lockb* ./

# Install bun manually for Alpine Linux ARM64
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/remix/.bun/bin:$PATH"

# Install dependencies - use npm as fallback
RUN if [ -f "bun.lockb" ] && [ -x "$(command -v bun)" ]; then \
    bun install; \
    else \
    npm ci; \
    fi

# Copy app source
COPY --chown=remix:nodejs . .

# Build the application - use npm as fallback
RUN if [ -f "bun.lockb" ] && [ -x "$(command -v bun)" ]; then \
    bun run build; \
    else \
    npm run build; \
    fi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/healthcheck || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]