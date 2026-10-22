// =============================================================================
// Rotte interne per gli altri servizi (ADR089) — montate su /internal
// =============================================================================
//   GET /internal/anagrafiche/:uuid/contatti
//       Contatti di un'anagrafica: ragione sociale, referente con i suoi
//       contatti, email dell'azienda e l'operatore EDG che la segue (nome ed
//       email). Serve a vigilo-service per le email "Vigilo è pronto".
//
// Non passano dal gateway: solo il segreto dei servizi (requireGatewaySecret).
// Solo lettura: nessun audit.
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { requireGatewaySecret } from '../middleware/auth';
import { validateParams } from '../middleware/validate';
import { Anagrafica, Operatore } from '../models';

const router = Router();
router.use(requireGatewaySecret);

const uuidParam = Joi.object({ uuid: Joi.string().guid().required() });

router.get('/anagrafiche/:uuid/contatti', validateParams(uuidParam), async (req: Request, res: Response) => {
  const a = await Anagrafica.findOne({
    where: { uuidAnagrafica: req.params.uuid },
    include: [{ model: Operatore, as: 'seguitoDa', attributes: ['nome', 'cognome', 'email', 'isActive'] }],
  });
  if (!a) {
    res.status(404).json({ success: false, error: 'Anagrafica non trovata' });
    return;
  }
  const op = (a as unknown as { seguitoDa?: Operatore | null }).seguitoDa ?? null;
  res.json({
    success: true,
    data: {
      ragioneSociale: a.ragioneSociale,
      referente: a.referente,
      telefonoReferente: a.telefonoReferente,
      emailReferente: a.emailReferente,
      email: a.email,
      isActive: a.isActive,
      seguitoDa: op ? { nome: `${op.nome} ${op.cognome}`, email: op.email, isActive: op.isActive } : null,
    },
  });
});

export default router;
