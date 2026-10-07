-- Migration: Moduli in vetrina (ADR056)
-- Date: 2026-10-06
-- Description: aggiunge al catalogo il flag `showcase` (in vetrina).
--              true  = i clienti che non hanno il modulo lo vedono comunque,
--                      spento (in grigio), per scoprirlo e chiederlo;
--              false = riservato: lo vede solo chi lo ha (predefinito).
--              Vale solo per i moduli 'disponibile': in sviluppo e dismessi
--              non vanno mai in vetrina, qualunque sia il flag.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).

ALTER TABLE `modules`
  ADD COLUMN `showcase` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'In vetrina: visibile anche a chi non lo ha, solo se disponibile (ADR056)' AFTER `status`;

-- VERIFICATION
-- SELECT `key`, `status`, `showcase` FROM modules;
