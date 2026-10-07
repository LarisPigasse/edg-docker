-- Migration: Versione dei moduli (ADR057)
-- Date: 2026-10-06
-- Description: aggiunge al catalogo la versione di ogni modulo
--              (major.minor.patch), mostrata nel piede del suo riquadro in
--              home. La aggiorna root a ogni rilascio dalla modifica del
--              modulo: un modulo vive in piu' servizi e il catalogo e' il
--              punto che li riassume.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).

ALTER TABLE `modules`
  ADD COLUMN `version` VARCHAR(16) NOT NULL DEFAULT '1.0.0' COMMENT 'Versione mostrata ai clienti, major.minor.patch (ADR057)' AFTER `trialDays`;

-- VERIFICATION
-- SELECT `key`, `status`, `version` FROM modules;
