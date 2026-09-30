# edg-docker/log-service/Dockerfile
# ----------------------------------------------------
# 1. Fase di Build
# ----------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copia package.json e installa le dipendenze
COPY package.json package-lock.json ./
RUN npm install

# Copia il codice sorgente e builda
COPY . .
# Esegue la compilazione TypeScript (npm run build)
RUN npm run build
# Identita' della build (ADR044): quando e' stata costruita l'immagine e, se
# passato da docker compose (GIT_COMMIT), da quale commit. Letta da /health.
# Si rigenera solo quando cambia il codice: stessa immagine, stessa build.
ARG GIT_COMMIT=
RUN printf '{"builtAt":"%s","commit":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$GIT_COMMIT" > dist/build-info.json

# ----------------------------------------------------
# 2. Fase di Produzione Leggera
# ----------------------------------------------------
FROM node:18-alpine

# Imposta la variabile d'ambiente di default
ENV NODE_ENV production

# Usa un utente non-root per sicurezza (SENZA specificare GID e UID fissi)
RUN addgroup appgroup && adduser -S -G appgroup appuser

WORKDIR /app

# Copia solo i file essenziali (compilato, package.json, node_modules)
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

# Espone la porta definita in server.ts (4000 di default)
EXPOSE 4000

# Avvia l'applicazione (npm start usa node dist/server.js)
CMD ["npm", "start"]