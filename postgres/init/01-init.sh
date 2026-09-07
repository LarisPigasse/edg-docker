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
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "edg_vehicles" <<-EOSQL
  GRANT ALL ON SCHEMA public TO $POSTGRES_VEHICLE_USER;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "edg_system" <<-EOSQL
  GRANT ALL ON SCHEMA public TO $POSTGRES_SYSTEM_USER;
EOSQL