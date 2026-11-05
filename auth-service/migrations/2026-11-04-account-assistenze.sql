-- Migration: accessi dell'assistenza visibili al cliente (AA5, ADR106)
-- Date: 2026-11-04
-- Description: permesso 'account.assistenze' al ruolo admin: l'amministratore
--              del cliente vede quando e perche' il personale EDG e' entrato
--              nel suo tenant (GET /auth/assistenza/nel-mio-tenant e pagina
--              "Accessi dell'assistenza EDG" di app-frontend).
--              Vale dal prossimo login o rinnovo del token.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).
-- Idempotente: il permesso non si duplica.

INSERT INTO `role_permissions` (`roleId`, `permission`, `createdAt`)
SELECT r.`id`, 'account.assistenze', NOW()
FROM `roles` r
WHERE r.`name` = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` x WHERE x.`roleId` = r.`id` AND x.`permission` = 'account.assistenze'
  );

-- VERIFICATION
-- SELECT r.name, rp.permission FROM role_permissions rp JOIN roles r ON r.id = rp.roleId WHERE rp.permission = 'account.assistenze';
