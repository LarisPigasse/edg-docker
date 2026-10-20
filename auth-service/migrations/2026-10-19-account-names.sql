-- Migration: Nome e cognome sull'account (ADR081)
-- Date: 2026-10-19
-- Description: un account = una persona. Nome e cognome facoltativi: finche'
--              sono vuoti il frontend ricava il nome dall'email. Per gli
--              account operatore si copiano dall'operatore collegato
--              (pulsante "Aggiorna dall'operatore" in pro-frontend).
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).

ALTER TABLE `accounts`
  ADD COLUMN `firstName` VARCHAR(64) NULL COMMENT 'Nome della persona (ADR081)' AFTER `email`,
  ADD COLUMN `lastName` VARCHAR(64) NULL COMMENT 'Cognome della persona (ADR081)' AFTER `firstName`;

-- VERIFICATION
-- SELECT id, email, firstName, lastName FROM accounts;
