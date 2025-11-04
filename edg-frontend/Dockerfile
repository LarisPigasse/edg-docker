# =============================================================================
# PRO-FRONTEND - Multi-stage Dockerfile
# =============================================================================
# Stage 1: Development con Hot Reload
# Stage 2: Builder per produzione
# Stage 3: Nginx production server
# =============================================================================

# =============================================================================
# STAGE 1: DEVELOPMENT (Hot Reload con Vite)
# =============================================================================
FROM node:20-alpine AS frontend-dev

# Installa wget per healthcheck
RUN apk add --no-cache wget

# Imposta directory di lavoro
WORKDIR /app

# Copia file package per cache layer
COPY package.json package-lock.json* ./

# Installa tutte le dipendenze (incluse devDependencies)
RUN npm ci

# Copia codice sorgente (sovrascritto da volume in docker-compose)
COPY . .

# Esponi porta Vite dev server
EXPOSE 5173

# Health check per development
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1

# Comando per avviare dev server (host 0.0.0.0 per Docker networking)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# =============================================================================
# STAGE 2: BUILDER (Build produzione)
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia package files
COPY package.json package-lock.json* ./

# Installa solo dipendenze di produzione + build tools
RUN npm ci --only=production && \
    npm install --save-dev vite @vitejs/plugin-react && \
    npm cache clean --force

# Copia codice sorgente
COPY . .

# Build dell'applicazione per produzione
RUN npm run build

# Verifica che la build sia andata a buon fine
RUN test -d dist || (echo "Build failed: dist directory not found" && exit 1)

# =============================================================================
# STAGE 3: PRODUCTION (Nginx server)
# =============================================================================
FROM nginx:alpine AS frontend-prod

# Copia file statici compilati da builder stage
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copia configurazione nginx custom (se necessario)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Esponi porta 80
EXPOSE 80

# Health check per production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Comando per avviare nginx
CMD ["nginx", "-g", "daemon off;"]
