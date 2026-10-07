-- Migration: il settore lascia il tenant (ADR059)
-- Date: 2026-10-06
-- Description: il settore di attivita' descrive l'azienda, quindi passa
--              all'anagrafica (system-service, tabella di base "settori").
--              Un tenant collegato a un cliente lo ricava dal cliente.
--              La colonna tenants.sector (ADR047) non era ancora usata da
--              nessun modulo: si elimina.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).

-- Controllo prima: deve restituire 0 righe (nessun settore impostato)
-- SELECT id, name, sector FROM tenants WHERE sector IS NOT NULL;

ALTER TABLE `tenants` DROP COLUMN `sector`;

-- VERIFICATION
-- SHOW COLUMNS FROM tenants;
