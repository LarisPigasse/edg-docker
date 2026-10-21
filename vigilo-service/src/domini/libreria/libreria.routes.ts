// =============================================================================
// Libreria di EDG — /api/vigilo/libreria (qualunque permesso Vigilo)
// =============================================================================
//   GET /libreria/modelli   i settori della libreria (chiave, nome, descrizione)
// Servono fuori dalla procedura di avvio: in EDG Pro, all'attivazione di
// Vigilo per un cliente, si scelgono i settori suggeriti (ADR087).
// =============================================================================
import { Router, Request, Response } from 'express';
import { CAPACITA, richiedi } from '../../core/middleware/permessi';
import { successResponse } from '../../core/utils/response';
import { ModelloSettore } from './modelloSettore.model';

export const libreriaRoutes = Router();

libreriaRoutes.get('/libreria/modelli', richiedi(...CAPACITA), async (_req: Request, res: Response) => {
  const modelli = await ModelloSettore.findAll({ order: [['ordine', 'ASC']] });
  successResponse(
    res,
    modelli.map(m => ({
      chiave: m.chiave,
      nome: m.nome,
      descrizione: m.descrizione ?? null,
      sempreProposto: m.sempreProposto,
    }))
  );
});
