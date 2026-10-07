-- Migration: Aspetto dei moduli (ADR054)
-- Date: 2026-10-05
-- Description: aggiunge al catalogo il campo `branding` con i tre elementi
--              grafici di un modulo: icona (piccola, es. 64x64), logo (grande,
--              home del modulo) e titolo (header in alto a sinistra).
--              Per ciascuno: { "mode": "file" | "text", "text": ..., "classes": ... }
--                - file: immagine src/assets/moduli/<chiave>/{icon,logo,titolo}.png
--                        nel frontend (se manca, si mostra il testo)
--                - text: testo (vuoto = nome del modulo) con classi Tailwind
--              NULL = testo con il nome del modulo e lo stile predefinito.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).

ALTER TABLE `modules`
  ADD COLUMN `branding` JSON NULL COMMENT 'Icona, logo e titolo del modulo: immagine o testo con classi Tailwind (ADR054)' AFTER `trialDays`;

-- VERIFICATION
-- SELECT `key`, `branding` FROM modules;
