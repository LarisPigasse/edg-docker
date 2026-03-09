#!/bin/bash
# =============================================================================
# EDG PostgreSQL - Inizializzazione istanza
# Eseguito automaticamente al primo avvio del container (volume vuoto)
# =============================================================================
# NOTA: edg_vehicles è già creato automaticamente da POSTGRES_DB nel compose.
# Questo script crea: utente applicativo vehicle_user + database futuro edg_operational
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
  -- Database per l'applicazione operativa (futuro operational-service)
  -- -------------------------------------------------------------------------
  CREATE DATABASE edg_operational;

  -- -------------------------------------------------------------------------
  -- Log inizializzazione
  -- -------------------------------------------------------------------------
  \echo '>>> EDG PostgreSQL: inizializzazione completata'
  \echo '>>> Database attivi: edg_vehicles, edg_operational'
  \echo '>>> Utente vehicle_user creato con accesso a edg_vehicles'

EOSQL