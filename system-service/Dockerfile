# =============================================================================
# EDG System Service - Dockerfile
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
# Identita' della build (ADR044): quando e' stata costruita l'immagine e, se
# passato da docker compose (GIT_COMMIT), da quale commit. Letta da /health.
# Si rigenera solo quando cambia il codice: stessa immagine, stessa build.
ARG GIT_COMMIT=
RUN printf '{"builtAt":"%s","commit":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$GIT_COMMIT" > dist/build-info.json

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

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

CMD ["node", "dist/app.js"]
