FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 5001
# These environment variables will be overridden by docker-compose or runtime environment
ENV DATABASE_URL postgres://postgres:postgres@postgres:5432/furniture_delivery
ENV SESSION_SECRET furniture_delivery_session_secret
ENV JWT_SECRET furniture_delivery_jwt_secret
ENV WS_PATH /ws
ENV LOG_LEVEL info

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy .env.example as reference
#COPY --from=builder /app/.env.example ./

# Create docker-entrypoint.sh for potential runtime configuration
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs /app
USER appuser

# Expose port and start application
EXPOSE 5001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]