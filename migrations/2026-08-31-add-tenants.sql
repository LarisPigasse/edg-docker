-- Migration: Multi-tenant feature toggling (ADR009)
-- Date: 2026-08-31
-- Description: Aggiunge tenants, tenant_modules e il collegamento accounts.tenantId.
--              Introduce un tenant di sistema (EDG) con modulo wildcard '*' per lo
--              staff interno, cosi' tenantId non e' mai NULL per nessun account.

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================

CREATE TABLE `tenants` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'ID interno auto-incrementale',
  `uuid` CHAR(36) NOT NULL COMMENT 'UUID pubblico per identificazione esterna',
  `name` VARCHAR(128) NOT NULL COMMENT 'Ragione sociale / nome del tenant',
  `slug` VARCHAR(64) NOT NULL COMMENT 'Identificativo breve, usato per mapping dominio->tenant (ADR012)',
  `isSystem` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Tenant di sistema (EDG stesso) - non modificabile/eliminabile',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Tenant attivo nel sistema',
  `defaultLocale` VARCHAR(5) NULL DEFAULT 'it' COMMENT 'Lingua di default del tenant (es. it, en) - riservato per uso futuro',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tenant_uuid` (`uuid`),
  UNIQUE KEY `unique_tenant_slug` (`slug`),
  KEY `idx_tenant_is_system` (`isSystem`),
  KEY `idx_tenant_is_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tenant (clienti) del sistema multi-tenant';

-- ============================================================================
-- TENANT_MODULES TABLE (join table, stesso pattern di role_permissions)
-- ============================================================================

CREATE TABLE `tenant_modules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tenantId` INT NOT NULL COMMENT 'Tenant a cui appartiene il modulo',
  `module` VARCHAR(50) NOT NULL COMMENT 'Modulo attivato: es. vehicles, vigilo, spedizioni, o wildcard *',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tenant_module` (`tenantId`, `module`),
  KEY `idx_tenant_modules_tenant_id` (`tenantId`),
  KEY `idx_tenant_modules_module` (`module`),
  CONSTRAINT `fk_tenant_modules_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moduli applicativi attivi per tenant (feature toggling)';

-- ============================================================================
-- ACCOUNTS TABLE - Aggiunge tenantId
-- ============================================================================

ALTER TABLE `accounts`
ADD COLUMN `tenantId` INT NULL COMMENT 'Tenant di appartenenza (mai NULL a regime: gli account interni EDG puntano al tenant di sistema)' AFTER `entityId`,
ADD CONSTRAINT `fk_accounts_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD INDEX `idx_accounts_tenant_id` (`tenantId`);

-- ============================================================================
-- SEED - Tenant di sistema EDG con modulo wildcard
-- ============================================================================

INSERT INTO `tenants` (`uuid`, `name`, `slug`, `isSystem`, `isActive`, `defaultLocale`)
VALUES (UUID(), 'Express Delivery Group', 'edg', TRUE, TRUE, 'it');

INSERT INTO `tenant_modules` (`tenantId`, `module`)
SELECT `id`, '*' FROM `tenants` WHERE `slug` = 'edg';

-- Assegna il tenant di sistema a tutti gli account esistenti privi di tenantId
-- (oggi solo operatori interni, essendo la feature nuova)
UPDATE `accounts`
SET `tenantId` = (SELECT `id` FROM `tenants` WHERE `slug` = 'edg')
WHERE `tenantId` IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- SELECT * FROM tenants;
-- SELECT t.slug, tm.module FROM tenant_modules tm JOIN tenants t ON t.id = tm.tenantId;
-- SELECT id, email, accountType, tenantId FROM accounts;
