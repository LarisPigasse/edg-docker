-- Migration: permessi di Vigilo sui ruoli e ruolo addetto (ADR084)
-- Date: 2026-10-21
-- Description: assegna i permessi di Vigilo ai ruoli globali, come da
--              docs/vigilo/05-permessi.md (5.3), e crea il ruolo 'addetto':
--                admin     -> vigilo.*
--                operatore -> vigilo.write, vigilo.costi
--                guest     -> vigilo.read
--                addetto   -> vigilo.own (nuovo ruolo di sistema)
--              I permessi valgono dal prossimo login o rinnovo del token.
--
-- Esecuzione: una sola volta, sul database di auth-service (edg_auth).
-- Idempotente: non duplica ruolo e permessi se gia' presenti.

INSERT INTO `roles` (`uuid`, `name`, `description`, `isSystem`, `createdAt`, `updatedAt`)
SELECT UUID(), 'addetto', 'Addetto - solo le proprie scadenze e quelle dei mezzi assegnati', 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `name` = 'addetto');

INSERT INTO `role_permissions` (`roleId`, `permission`, `createdAt`)
SELECT r.`id`, p.`permission`, NOW()
FROM `roles` r
JOIN (
  SELECT 'admin' AS `role`, 'vigilo.*' AS `permission`
  UNION ALL SELECT 'operatore', 'vigilo.write'
  UNION ALL SELECT 'operatore', 'vigilo.costi'
  UNION ALL SELECT 'guest', 'vigilo.read'
  UNION ALL SELECT 'addetto', 'vigilo.own'
) p ON p.`role` = r.`name`
WHERE NOT EXISTS (
  SELECT 1 FROM `role_permissions` x WHERE x.`roleId` = r.`id` AND x.`permission` = p.`permission`
);

-- VERIFICATION
-- SELECT r.name, rp.permission FROM role_permissions rp JOIN roles r ON r.id = rp.roleId
--  WHERE rp.permission LIKE 'vigilo.%' ORDER BY r.name, rp.permission;
