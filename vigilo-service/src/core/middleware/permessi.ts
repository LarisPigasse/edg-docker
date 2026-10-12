// =============================================================================
// EDG Vigilo Service - Permessi (ADR068)
// =============================================================================
// Cinque capacita', non un elenco di create/update/delete per tabella:
//   config  avvio, categorie, controlli, aggiornamenti della libreria, impostazioni
//   write   dati operativi (soggetti, scadenze, registrazioni, fornitori, allegati)
//   read    tutto il tenant in lettura
//   costi   importi e resoconti
//   own     addetto: solo il proprio ambito (passo 5.4)
// write e config comprendono la lettura. I permessi arrivano dal JWT come
// stringhe '<modulo>.<azione>': '*' tutto, 'vigilo.*' tutto Vigilo, '!x' nega.
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import { forbidden, unauthorized } from '../utils/response';

export const CAPACITA = ['config', 'write', 'read', 'costi', 'own'] as const;
export type Capacita = (typeof CAPACITA)[number];
export type Capacitas = Record<Capacita, boolean>;

const MODULO = 'vigilo';

/** Il permesso 'vigilo.<azione>' e' concesso? (negazioni prima di tutto) */
function concesso(permessi: readonly string[], azione: string): boolean {
  const target = `${MODULO}.${azione}`;
  if (permessi.includes(`!${target}`) || permessi.includes(`!${MODULO}.*`) || permessi.includes('!*')) return false;
  return permessi.includes('*') || permessi.includes(`${MODULO}.*`) || permessi.includes(target);
}

/** Le capacita' effettive di un utente: write e config comprendono read */
export function capacitaDi(permessi: readonly string[]): Capacitas {
  const c = Object.fromEntries(CAPACITA.map(a => [a, concesso(permessi, a)])) as Capacitas;
  c.read = c.read || c.write || c.config;
  return c;
}

/** Almeno una capacita' di Vigilo (chi non ne ha non vede il modulo, ADR061) */
export const usaVigilo = (c: Capacitas): boolean => CAPACITA.some(a => c[a]);

/** Middleware: serve almeno UNA delle capacita' indicate */
export function richiedi(...ammesse: Capacita[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }
    const c = capacitaDi(req.user.permissions);
    if (!ammesse.some(a => c[a])) {
      forbidden(res, `Permesso mancante: ${ammesse.map(a => `${MODULO}.${a}`).join(' o ')}`);
      return;
    }
    next();
  };
}
