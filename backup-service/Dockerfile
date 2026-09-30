# =============================================================================
# EDG Backup Service (ADR045)
# Strumenti di dump dei tre database della piattaforma:
#   - mariadb-client (mariadb-dump) + connector-c: plugin caching_sha2_password
#     per l'autenticazione predefinita di MySQL 8
#   - postgresql16-client: pg_dump deve essere >= della versione del server
#   - mongodb-tools: mongodump / mongorestore
# =============================================================================
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Identita' della build (ADR044): quando e' stata costruita l'immagine e, se
# passato da docker compose (GIT_COMMIT), da quale commit. Letta da /health.
# Si rigenera solo quando cambia il codice: stessa immagine, stessa build.
ARG GIT_COMMIT=
RUN printf '{"builtAt":"%s","commit":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$GIT_COMMIT" > dist/build-info.json

FROM node:22-alpine AS production
RUN apk add --no-cache mariadb-client mariadb-connector-c postgresql16-client mongodb-tools tar tzdata
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3005
HEALTHCHECK --interval=32s --timeout=8s --start-period=16s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1
CMD ["node", "dist/app.js"]
