#!/bin/bash
# =============================================================================
# EDG PostgreSQL - Database di Vigilo (ADR065)
# =============================================================================
# Crea l'utente applicativo e il database edg_vigilo, di proprieta' dell'utente
# (cosi' ha pieno diritto sullo schema public, PostgreSQL 15+).
#
# - Volume nuovo: eseguito in automatico al primo avvio del container.
# - Volume esistente: eseguirlo UNA volta a mano (e' idempotente):
#     docker exec edg-postgres bash /docker-entrypoint-initdb.d/02-vigilo.sh
#   dopo aver aggiunto POSTGRES_VIGILO_USER e POSTGRES_VIGILO_PASSWORD al file
#   .env e ricreato il container (docker compose up -d postgres).
# =============================================================================
set -e

if [ -z "$POSTGRES_VIGILO_USER" ] || [ -z "$POSTGRES_VIGILO_PASSWORD" ]; then
  echo ">>> Vigilo: POSTGRES_VIGILO_USER o POSTGRES_VIGILO_PASSWORD mancanti, nessuna operazione"
  exit 1
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<EOSQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$POSTGRES_VIGILO_USER') THEN
    CREATE ROLE $POSTGRES_VIGILO_USER LOGIN PASSWORD '$POSTGRES_VIGILO_PASSWORD';
  END IF;
END
\$\$;
EOSQL

if psql --username "$POSTGRES_USER" --dbname postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'edg_vigilo'" | grep -q 1; then
  echo ">>> Vigilo: database edg_vigilo gia' presente"
else
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c "CREATE DATABASE edg_vigilo OWNER $POSTGRES_VIGILO_USER"
  echo ">>> Vigilo: database edg_vigilo creato, proprietario $POSTGRES_VIGILO_USER"
fi
