# ----------------------------------------------------------------------------
# FASE 1: BUILD (Compilazione TypeScript e Installazione dipendenze)
# ----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia i file di definizione del pacchetto (package.json e package-lock.json)
# per installare le dipendenze
COPY package.json ./
COPY package-lock.json ./

# Installa le dipendenze di produzione e sviluppo
RUN npm install

# Copia tutto il codice sorgente
COPY . .

# Esegui la build di TypeScript (presuppone uno script 'npm run build' nel tuo package.json)
# Questo compila il codice TypeScript in JavaScript (generalmente in una cartella 'dist' o 'build')
RUN npm run build

# ----------------------------------------------------------------------------
# FASE 2: PRODUCTION (Ambiente leggero per l'esecuzione)
# ----------------------------------------------------------------------------
FROM node:20-alpine

# Imposta la directory di lavoro finale
WORKDIR /app

# Copia solo i file essenziali per l'esecuzione dalla fase builder
# 1. Copia i soli file JS compilati
COPY --from=builder /app/dist ./dist

# 2. Copia i soli file necessari per l'esecuzione (package.json per start e dependencies)
COPY --from=builder /app/package.json ./package.json

# Installa SOLO le dipendenze di produzione (più leggero)
RUN npm install --only=production

# Espone la porta del servizio
EXPOSE 3001

# Comando di avvio in produzione
# Presuppone uno script 'npm start' che esegua 'node dist/app.js' o equivalente
CMD ["npm", "start"]