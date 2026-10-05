// src/modules/auth/utils/actorLimits.ts
// =============================================================================
// Limiti di chi non e' root sugli account (ADR049)
// =============================================================================
// Un solo punto, usato da AccountController (crea, modifica, attiva/disattiva)
// e da SessionController (blocca/sblocca): l'admin EDG gestisce tutti gli
// account e i ruoli tranne root. Solo chi ha gia' il permesso '*' puo'
// assegnare il ruolo root o agire su un account root.
// =============================================================================
import type { Request } from 'express';

export const ROOT_ROLE = 'root';

/** Root = permesso jolly '*' (stesso criterio di requireRoot) */
export function isRootActor(req: Request): boolean {
  const permissions: unknown = (req as any).account?.permissions;
  return Array.isArray(permissions) && permissions.includes('*');
}

async function roleName(roleModel: any, roleId: number | null | undefined): Promise<string | null> {
  if (!roleId) return null;
  const role = await roleModel.findByPk(roleId, { attributes: ['name'] });
  return role?.name ?? null;
}

/**
 * Ritorna il messaggio di rifiuto, o null se l'azione e' consentita.
 *
 * @param roleModel modello Role (per risolvere il nome del ruolo)
 * @param target    account su cui si agisce (null in creazione)
 * @param newRoleId ruolo che si vuole assegnare (se cambia)
 */
export async function checkActorLimits(
  req: Request,
  roleModel: any,
  target: { roleId?: number | null } | null,
  newRoleId?: number
): Promise<string | null> {
  if (isRootActor(req)) return null;
  if (target && (await roleName(roleModel, target.roleId)) === ROOT_ROLE) {
    return 'Gli account root possono essere gestiti solo da root';
  }
  if (newRoleId !== undefined && (await roleName(roleModel, newRoleId)) === ROOT_ROLE) {
    return 'Il ruolo root può essere assegnato solo da root';
  }
  return null;
}
