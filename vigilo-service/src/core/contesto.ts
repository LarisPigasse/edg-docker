// =============================================================================
// Contesto di una richiesta per i servizi dei domini
// =============================================================================
// Tenant (sempre da req.user, ADR068), account, capacita' e il giorno di oggi:
// i servizi ricevono questo e non conoscono Express.
// =============================================================================
import type { Request } from 'express';
import type { Giorno } from '../regole';
import type { GatewayUser } from './middleware/auth';
import { capacitaDi, type Capacitas } from './middleware/permessi';
import { oggiInItalia } from './utils/oggi';

export interface Contesto {
  idTenant: number;
  utente: GatewayUser;
  capacita: Capacitas;
  oggi: Giorno;
}

export function contestoDi(req: Request): Contesto {
  const utente = req.user!;
  return { idTenant: utente.tenantId!, utente, capacita: capacitaDi(utente.permissions), oggi: oggiInItalia() };
}

/** Contesto dei processi pianificati: nessun utente, un tenant per volta */
export function contestoDiProcesso(idTenant: number): Contesto {
  return {
    idTenant,
    utente: { id: 0, email: 'vigilo', role: 'sistema', tenantId: idTenant, roleId: 0, permissions: [], systemTenant: false },
    capacita: { config: true, write: true, read: true, costi: true, own: false },
    oggi: oggiInItalia(),
  };
}
