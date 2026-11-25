-- Migration: Log delle attivita' visibili all'admin EDG (fase 1, passo 1a)
-- Date: 2026-11-24
-- Description: permesso 'sistema.logs' al ruolo admin: il personale EDG con
--              ruolo admin apre SISTEMA > Logs e vede tutti i log (decisione
--              dell'utente). log-service lo accetta solo con systemTenant nel
--              JWT (ADR051): gli admin dei clienti hanno il permesso ma
--              log-service li respinge, e pro-frontend non e' per loro.
--              Vale dal prossimo login o rinnovo del token.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).
-- Idempotente: il permesso non si duplica.

INSERT INTO `role_permissions` (`roleId`, `permission`, `createdAt`)
SELECT r.`id`, 'sistema.logs', NOW()
FROM `roles` r
WHERE r.`name` = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` x WHERE x.`roleId` = r.`id` AND x.`permission` = 'sistema.logs'
  );

-- VERIFICATION
-- SELECT r.name, rp.permission FROM role_permissions rp JOIN roles r ON r.id = rp.roleId WHERE rp.permission = 'sistema.logs';
