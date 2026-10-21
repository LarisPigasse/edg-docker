-- Migration: Accesso assistito (ADR085)
-- Date: 2026-10-21
-- Description: tabella delle sessioni assistite (il personale EDG entra nel
--              tenant di un cliente dal proprio account, per 64 minuti) e
--              permesso 'sistema.assistenza' all'admin. Analisi in
--              docs/piattaforma/accesso-assistito.md.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).
-- Idempotente: tabella e permesso non si duplicano.

CREATE TABLE IF NOT EXISTS `assisted_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `operatorAccountId` INT NOT NULL COMMENT 'Chi agisce davvero (account del personale EDG)',
  `tenantId` INT NOT NULL COMMENT 'Tenant del cliente in cui si entra',
  `modo` VARCHAR(16) NOT NULL COMMENT 'preparazione | assistenza',
  `perContoAccountId` INT NULL COMMENT 'Solo in assistenza: utente di cui si vede la vista',
  `motivo` VARCHAR(256) NOT NULL,
  `startedAt` DATETIME NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `endedAt` DATETIME NULL,
  `endReason` VARCHAR(16) NULL COMMENT 'uscita | scaduta | chiusa',
  `endedByAccountId` INT NULL COMMENT 'Chi ha chiuso la sessione (uscita o chiusura da EDG)',
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` VARCHAR(512) NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_assisted_session_uuid` (`uuid`),
  KEY `idx_assisted_operator_open` (`operatorAccountId`, `endedAt`, `expiresAt`),
  KEY `idx_assisted_tenant` (`tenantId`),
  KEY `idx_assisted_started` (`startedAt`),
  CONSTRAINT `fk_assisted_operator` FOREIGN KEY (`operatorAccountId`) REFERENCES `accounts` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_assisted_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_assisted_modo` CHECK (`modo` IN ('preparazione', 'assistenza')),
  CONSTRAINT `chk_assisted_end_reason` CHECK (`endReason` IS NULL OR `endReason` IN ('uscita', 'scaduta', 'chiusa'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `role_permissions` (`roleId`, `permission`, `createdAt`)
SELECT r.`id`, 'sistema.assistenza', NOW()
FROM `roles` r
WHERE r.`name` = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` x WHERE x.`roleId` = r.`id` AND x.`permission` = 'sistema.assistenza'
  );

-- VERIFICATION
-- SHOW CREATE TABLE assisted_sessions;
-- SELECT r.name, rp.permission FROM role_permissions rp JOIN roles r ON r.id = rp.roleId WHERE rp.permission = 'sistema.assistenza';
