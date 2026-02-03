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

# Espone porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Avvia
CMD ["node", "gateway.js"]
