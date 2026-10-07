-- Migration: Collegamento tenant -> cliente dell'anagrafica EDG (ADR058)
-- Date: 2026-10-06
-- Description: aggiunge al tenant l'UUID del cliente dell'anagrafica EDG
--              (system-service, PostgreSQL) a cui corrisponde. Riferimento
--              "morbido" (database diversi, ADR014). Facoltativo e al
--              massimo uno: un cliente ha al piu' un tenant (indice UNIQUE;
--              in MySQL piu' righe con NULL sono ammesse).
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).

ALTER TABLE `tenants`
  ADD COLUMN `clienteUuid` CHAR(36) NULL COMMENT 'Cliente dell anagrafica EDG collegato, al massimo un tenant per cliente (ADR058)' AFTER `sector`,
  ADD UNIQUE KEY `unique_tenant_cliente` (`clienteUuid`);

-- VERIFICATION
-- SELECT id, name, slug, clienteUuid FROM tenants;
