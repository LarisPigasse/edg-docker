-- Migration: Gestione moduli, fase 1 — catalogo e attivazioni (ADR047)
-- Date: 2026-10-01
-- Description: Introduce il catalogo dei moduli (`modules`), trasforma
--              `tenant_modules` da semplice elenco in ATTIVAZIONE con stato e
--              periodo, aggiunge il settore di attivita' al tenant e i nuovi
--              permessi dell'admin.
--
-- Il tenant di sistema (isSystem = true) non ha piu' righe in tenant_modules:
-- il jolly '*' nel JWT viene dato dal codice (AuthService), cosi' la chiave
-- esterna verso il catalogo resta pulita.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).

-- ============================================================================
-- 1. CATALOGO MODULI
-- ============================================================================
-- Il modulo nasce nel codice (manifest features/<modulo>/module.ts), il
-- database lo accende. Catalogo piatto: nessuna gerarchia, solo prodotto e
-- dipendenze. `key` e' la chiave stabile usata ovunque (JWT, gateway, permessi).

CREATE TABLE `modules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(32) NOT NULL COMMENT 'Chiave stabile e immutabile (es. vigilo, spedizioni, tracking)',
  `name` VARCHAR(64) NOT NULL COMMENT 'Nome visualizzato',
  `description` VARCHAR(256) NULL COMMENT 'Descrizione breve per il catalogo',
  `product` VARCHAR(32) NOT NULL COMMENT 'Prodotto di appartenenza (raggruppa menu e branding, ADR012)',
  `dependencies` JSON NOT NULL COMMENT 'Chiavi dei moduli richiesti (es. ["spedizioni"])',
  `status` VARCHAR(16) NOT NULL DEFAULT 'sviluppo' COMMENT 'sviluppo | disponibile | dismesso',
  `trialDays` INT NOT NULL DEFAULT 32 COMMENT 'Durata predefinita della prova, in giorni',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_module_key` (`key`),
  KEY `idx_modules_product` (`product`),
  KEY `idx_modules_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Catalogo dei moduli attivabili per tenant (ADR047)';

INSERT INTO `modules` (`key`, `name`, `description`, `product`, `dependencies`, `status`, `trialDays`) VALUES
  ('vigilo',     'Vigilo',     'Scadenze, manutenzioni e controlli periodici di veicoli, mezzi e addetti', 'vigilo',     JSON_ARRAY(),             'sviluppo', 32),
  ('spedizioni', 'Spedizioni', 'Gestione delle spedizioni',                                              'spedizioni', JSON_ARRAY(),             'sviluppo', 32),
  ('tracking',   'Tracking',   'Tracciamento delle spedizioni',                                          'spedizioni', JSON_ARRAY('spedizioni'), 'sviluppo', 32);

-- ============================================================================
-- 2. TENANT_MODULES -> ATTIVAZIONI
-- ============================================================================

-- 2a. Jolly del tenant di sistema: ora viene dal codice
DELETE tm FROM `tenant_modules` tm
JOIN `tenants` t ON t.`id` = tm.`tenantId`
WHERE t.`isSystem` = TRUE;

-- 2b. Chiave unica per Vigilo: 'vehicles' sparisce (ADR047)
UPDATE `tenant_modules` SET `module` = 'vigilo' WHERE `module` = 'vehicles';

-- 2c. Nuove colonne: stato, periodo, configurazione, chi l'ha concessa
ALTER TABLE `tenant_modules`
  MODIFY COLUMN `module` VARCHAR(32) NOT NULL COMMENT 'Chiave del modulo nel catalogo (modules.key)',
  ADD COLUMN `status` VARCHAR(16) NOT NULL DEFAULT 'attivo' COMMENT 'prova | attivo | sospeso | scaduto' AFTER `module`,
  ADD COLUMN `startsAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Inizio validita (UTC)' AFTER `status`,
  ADD COLUMN `endsAt` DATETIME NULL COMMENT 'Fine validita (UTC): obbligatoria per la prova, NULL = senza scadenza' AFTER `startsAt`,
  ADD COLUMN `expiredAt` DATETIME NULL COMMENT 'Quando e passata a scaduto: da qui i 64 giorni di conservazione dei dati' AFTER `endsAt`,
  ADD COLUMN `config` JSON NULL COMMENT 'Opzioni del modulo per questo tenant (es. Vigilo)' AFTER `expiredAt`,
  ADD COLUMN `notes` VARCHAR(256) NULL COMMENT 'Note interne (es. riferimento commerciale)' AFTER `config`,
  ADD COLUMN `grantedBy` INT NULL COMMENT 'Account che ha creato l attivazione' AFTER `notes`,
  ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `createdAt`,
  ADD INDEX `idx_tenant_modules_status` (`status`),
  ADD INDEX `idx_tenant_modules_ends_at` (`endsAt`),
  ADD CONSTRAINT `fk_tenant_modules_module` FOREIGN KEY (`module`) REFERENCES `modules` (`key`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_tenant_modules_granted_by` FOREIGN KEY (`grantedBy`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  COMMENT = 'Attivazioni dei moduli per tenant, con stato e periodo (ADR047)';

-- ============================================================================
-- 3. TENANT: SETTORE DI ATTIVITA'
-- ============================================================================
-- Vale per tutti i moduli (es. trasportatore, agricola, movimento-terra).
-- Valori ancora da definire: chiave libera validata dall'applicazione.

ALTER TABLE `tenants`
  ADD COLUMN `sector` VARCHAR(32) NULL COMMENT 'Settore di attivita (es. trasportatore, agricola, movimento-terra)' AFTER `slug`;

-- ============================================================================
-- 4. PERMESSI ADMIN (ADR047 punto 4)
-- ============================================================================
-- sistema.moduli: attivazioni e prove dei tenant
-- sistema.tenant: creazione e modifica dei tenant (l'eliminazione resta a root)
-- Root ha gia' '*'. Il catalogo resta riservato a root.

INSERT INTO `role_permissions` (`roleId`, `permission`, `createdAt`)
SELECT r.`id`, p.`permission`, NOW()
FROM `roles` r
JOIN (SELECT 'sistema.moduli' AS `permission` UNION ALL SELECT 'sistema.tenant') p
WHERE r.`name` = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` x WHERE x.`roleId` = r.`id` AND x.`permission` = p.`permission`
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- SELECT `key`, `product`, `dependencies`, `status`, `trialDays` FROM modules;
-- SELECT t.slug, tm.module, tm.status, tm.startsAt, tm.endsAt FROM tenant_modules tm JOIN tenants t ON t.id = tm.tenantId;
-- SELECT r.name, rp.permission FROM role_permissions rp JOIN roles r ON r.id = rp.roleId WHERE r.name = 'admin';
