# =============================================================================
# EDG Vehicle Service - Dockerfile
# Multi-stage build: development + production
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci --only=production && npm ci

# Compila TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 2: Production
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production

WORKDIR /app

# Solo dipendenze production
COPY package*.json ./
RUN npm ci --only=production

# Copia build compilata
COPY --from=builder /app/dist ./dist

# Copia migration e config CLI (per eseguire migration in produzione)
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/src/config/sequelize-cli.js ./src/config/sequelize-cli.js
COPY .sequelizerc ./

# Crea cartella uploads
RUN mkdir -p /uploads/vehicles

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health || exit 1

CMD ["node", "dist/app.js"]