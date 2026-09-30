# =============================================================================
# EDG API GATEWAY v2.0 - Dockerfile
# =============================================================================
# Gateway con JWT validation e header injection
# Include middleware personalizzati
# =============================================================================

FROM node:20-alpine

WORKDIR /usr/src/app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm install --production

# Copia tutto il codice gateway (gateway.js + middleware/)
COPY . .
# Identita' della build (ADR044): quando e' stata costruita l'immagine e, se
# passato da docker compose (GIT_COMMIT), da quale commit. Letta da /health.
# Si rigenera solo quando cambia il codice: stessa immagine, stessa build.
ARG GIT_COMMIT=
RUN printf '{"builtAt":"%s","commit":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$GIT_COMMIT" > build-info.json

# Espone porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Avvia
CMD ["node", "gateway.js"]
