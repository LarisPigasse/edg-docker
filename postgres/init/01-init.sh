#!/bin/bash
# =============================================================================
# EDG PostgreSQL - Inizializzazione istanza
# Eseguito automaticamente al primo avvio del container (volume vuoto)
# =============================================================================
# NOTA: edg_vehicles è già creato automaticamente da POSTGRES_DB nel compose.
# Questo script crea: utente applicativo vehicle_user + database edg_system
# (per system-service) con il suo utente applicativo dedicato.
# =============================================================================
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL

  -- -------------------------------------------------------------------------
  -- Utente applicativo per vehicle-service
  -- Privilegi limitati: accede SOLO a edg_vehicles
  -- -------------------------------------------------------------------------
  CREATE USER $POSTGRES_VEHICLE_USER WITH PASSWORD '$POSTGRES_VEHICLE_PASSWORD';
  GRANT ALL PRIVILEGES ON DATABASE edg_vehicles TO $POSTGRES_VEHICLE_USER;

  -- -------------------------------------------------------------------------
  -- Database per system-service (gestione operativa: operatori, business
  -- entities/anagrafiche di partner-cliente-agente, e in futuro altro).
  -- -------------------------------------------------------------------------
  CREATE DATABASE edg_system;

  -- Utente applicativo per system-service
  -- Privilegi limitati: accede SOLO a edg_system
  CREATE USER $POSTGRES_SYSTEM_USER WITH PASSWORD '$POSTGRES_SYSTEM_PASSWORD';
  GRANT ALL PRIVILEGES ON DATABASE edg_system TO $POSTGRES_SYSTEM_USER;

  -- -------------------------------------------------------------------------
  -- Log inizializzazione
  -- -------------------------------------------------------------------------
  \echo '>>> EDG PostgreSQL: inizializzazione completata'
  \echo '>>> Database attivi: edg_vehicles, edg_system'
  \echo '>>> Utente vehicle_user creato con accesso a edg_vehicles'
  \echo '>>> Utente system_service_user creato con accesso a edg_system'

EOSQL

# Postgres 15+ non concede più CREATE su "public" a tutti gli utenti di default:
# va garantito esplicitamente all'utente applicativo, sul database corretto.
#
# ALTER DEFAULT PRIVILEGES qui sotto copre un caso che GRANT ON SCHEMA da solo
# non copre: se in futuro qualcuno crea o ricrea tabelle connesso come
# $POSTGRES_USER (es. eseguendo uno script SQL a mano da DBeaver, invece che
# lasciandole creare al servizio applicativo), quelle tabelle risultano di
# proprietà di $POSTGRES_USER e l'utente applicativo si ritrova "permission
# denied" pur avendo accesso allo schema - è esattamente quanto successo a
# system_service_user su reparti/operatori/anagrafiche nell'incidente di
# perdita dati Docker/WSL2 del 16/09/2026, risolto lì a mano con GRANT diretti.
# ALTER DEFAULT PRIVILEGES fa sì che gli oggetti creati DA QUI IN AVANTI da
# $POSTGRES_USER in questo schema siano già accessibili all'utente
# applicativo, senza dover ripetere il fix manuale ogni volta.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "edg_vehicles" <<-EOSQL
  GRANT ALL ON SCHEMA public TO $POSTGRES_VEHICLE_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $POSTGRES_VEHICLE_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO $POSTGRES_VEHICLE_USER;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "edg_system" <<-EOSQL
  GRANT ALL ON SCHEMA public TO $POSTGRES_SYSTEM_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $POSTGRES_SYSTEM_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO $POSTGRES_SYSTEM_USER;
EOSQL