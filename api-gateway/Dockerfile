# =============================================================================
# SIMPLE API GATEWAY - Dockerfile
# =============================================================================
# Gateway semplice con Express.js puro
# Alternativa garantita funzionante a Express Gateway
# =============================================================================

FROM node:20-alpine

WORKDIR /usr/src/app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm install --production

# Copia codice gateway
COPY gateway.js ./

# Espone porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Avvia
CMD ["node", "gateway.js"]
