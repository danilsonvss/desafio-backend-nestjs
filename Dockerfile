# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and scripts (needed for postinstall)
COPY package*.json ./
COPY scripts ./scripts/
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Clean any existing Prisma Client and generate
RUN rm -rf node_modules/.prisma node_modules/@prisma/client/.prisma 2>/dev/null || true
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and scripts (needed for postinstall)
COPY package*.json ./
COPY scripts ./scripts/
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Clean any existing Prisma Client and generate
RUN rm -rf node_modules/.prisma node_modules/@prisma/client/.prisma 2>/dev/null || true
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]

