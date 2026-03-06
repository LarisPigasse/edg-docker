-- Migration: Add session tracking and user blocking fields
-- Date: 2026-02-17
-- Description: Extend sessions table with device/geo info and accounts table with block fields

-- ============================================================================
-- SESSIONS TABLE - Add tracking columns
-- ============================================================================

ALTER TABLE `sessions`
ADD COLUMN `device` VARCHAR(50) NULL COMMENT 'Tipo dispositivo: Desktop, Mobile, Tablet' AFTER `userAgent`,
ADD COLUMN `os` VARCHAR(100) NULL COMMENT 'Sistema operativo (es. Windows 11, macOS 14)' AFTER `device`,
ADD COLUMN `browser` VARCHAR(100) NULL COMMENT 'Browser e versione (es. Chrome 120)' AFTER `os`,
ADD COLUMN `geoCountry` VARCHAR(100) NULL COMMENT 'Paese (es. Italy)' AFTER `browser`,
ADD COLUMN `geoRegion` VARCHAR(100) NULL COMMENT 'Regione (es. Abruzzo)' AFTER `geoCountry`,
ADD COLUMN `geoCity` VARCHAR(100) NULL COMMENT 'Città (es. Pescara)' AFTER `geoRegion`,
ADD COLUMN `geoTimezone` VARCHAR(50) NULL COMMENT 'Timezone (es. Europe/Rome)' AFTER `geoCity`,
ADD COLUMN `lastActivityAt` DATETIME NULL COMMENT 'Ultimo accesso/attività' AFTER `geoTimezone`,
ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp ultimo aggiornamento' AFTER `lastActivityAt`;

-- Update existing sessions with null values for new fields
UPDATE `sessions` SET `lastActivityAt` = `createdAt` WHERE `lastActivityAt` IS NULL;

-- ============================================================================
-- ACCOUNTS TABLE - Add blocking fields
-- ============================================================================

ALTER TABLE `accounts`
ADD COLUMN `blockedUntil` DATETIME NULL COMMENT 'Data scadenza blocco temporaneo (null = permanente)' AFTER `lastLogin`,
ADD COLUMN `blockReason` TEXT NULL COMMENT 'Motivo del blocco' AFTER `blockedUntil`;

-- ============================================================================
-- INDEXES (optional, for query optimization)
-- ============================================================================

-- Index for filtering active sessions
CREATE INDEX `idx_sessions_last_activity` ON `sessions` (`lastActivityAt` DESC);

-- Index for geo queries
CREATE INDEX `idx_sessions_geo_country` ON `sessions` (`geoCountry`);

-- Index for blocked accounts check
CREATE INDEX `idx_accounts_blocked` ON `accounts` (`isActive`, `blockedUntil`);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify sessions columns
-- SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sessions' AND TABLE_SCHEMA = 'edg_auth';

-- Verify accounts columns  
-- SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'accounts' AND TABLE_SCHEMA = 'edg_auth';
