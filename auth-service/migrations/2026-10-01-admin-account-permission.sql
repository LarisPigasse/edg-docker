-- Migration: Account gestibili dall'admin EDG (ADR049)
-- Date: 2026-10-01
-- Description: aggiunge all'admin il permesso 'sistema.account'.
--              Le rotte /auth/accounts lo richiedono insieme all'appartenenza
--              al tenant di sistema; eliminazione definitiva e permessi dei
--              ruoli restano a root. I limiti (mai root, mai il proprio ruolo)
--              sono nel controller.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).
-- Idempotente: non duplica il permesso se gia' presente.

INSERT INTO `role_permissions` (`roleId`, `permission`, `createdAt`)
SELECT r.`id`, 'sistema.account', NOW()
FROM `roles` r
WHERE r.`name` = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` x WHERE x.`roleId` = r.`id` AND x.`permission` = 'sistema.account'
  );

-- VERIFICATION
-- SELECT r.name, rp.permission FROM role_permissions rp JOIN roles r ON r.id = rp.roleId WHERE r.name = 'admin';
