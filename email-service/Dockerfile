# =============================================================================
# EDG EMAIL SERVICE - Dockerfile
# =============================================================================

FROM node:18-alpine AS base

WORKDIR /app

# Installa dipendenze di sistema necessarie per nodemailer
RUN apk add --no-cache \
    python3 \
    make \
    g++

# =============================================================================
# Development Stage
# =============================================================================
FROM base AS development

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]

# =============================================================================
# Build Stage
# =============================================================================
FROM base AS build

COPY package*.json ./

# Installa TUTTE le dipendenze (incluse devDependencies per build)
RUN npm ci

COPY . .
RUN npm run build

# =============================================================================
# Production Stage
# =============================================================================
FROM node:18-alpine AS production

WORKDIR /app

# Copia package.json e installa solo dipendenze di produzione
COPY package*.json ./
RUN npm install --omit=dev

# Copia build e template da build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/templates ./dist/templates

# User non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/app.js"]
