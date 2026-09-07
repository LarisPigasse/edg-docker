# =============================================================================
# VIGILO (servizio: asset-frontend) - Multi-stage Dockerfile
# =============================================================================
# Stage 1: Development con Hot Reload (Vite, porta 5176)
# Stage 2: Builder per produzione
# Stage 3: Nginx production server
# =============================================================================

# =============================================================================
# STAGE 1: DEVELOPMENT (Hot Reload con Vite)
# =============================================================================
FROM node:20-alpine AS frontend-dev

# Installa wget per healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copia file package per cache layer
COPY package.json package-lock.json* ./

# Installa tutte le dipendenze (incluse devDependencies)
RUN npm ci

# Copia codice sorgente (sovrascritto da volume in docker-compose)
COPY . .

# Porta del dev server Vite (strictPort in vite.config.ts)
EXPOSE 5176

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5176 || exit 1

# host 0.0.0.0 per Docker networking
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# =============================================================================
# STAGE 2: BUILDER (Build produzione)
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Le variabili VITE_ vengono "cotte" nel bundle: passarle come build-arg
ARG VITE_API_BASE_URL=""
ARG VITE_LOG_SERVICE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_LOG_SERVICE_URL=$VITE_LOG_SERVICE_URL

RUN npm run build

# Verifica che la build sia andata a buon fine
RUN test -d dist || (echo "Build failed: dist directory not found" && exit 1)

# =============================================================================
# STAGE 3: PRODUCTION (Nginx server)
# =============================================================================
FROM nginx:alpine AS frontend-prod

# Configurazione SPA (fallback su index.html)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Artefatti statici prodotti dallo stage builder
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
