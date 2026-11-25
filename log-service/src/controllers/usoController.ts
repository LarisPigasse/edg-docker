// src/controllers/usoController.ts — uso della piattaforma per tenant (fase 2 dei log, ADR117)
import { Request, Response } from 'express';
import { LIMITI, PARAMETRI, valoreLimitato } from '../config/parametri';
import { ultimoUsoDeiTenant, usoDelTenant } from '../services/uso';

/** Giorni chiesti, dentro i limiti (1-256); senza o non validi, il parametro del servizio */
const giorniDi = (req: Request): number => valoreLimitato(req.query.giorni, { ...LIMITI.usoGiorni, predefinito: PARAMETRI.usoGiorni });

/** GET /uso?tenantId=..&giorni=.. — riepilogo di un tenant */
export const usoTenant = async (req: Request, res: Response): Promise<void> => {
  const tenantId = Number(typeof req.query.tenantId === 'string' ? req.query.tenantId : NaN);
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    res.status(400).json({ message: 'Tenant mancante o non valido' });
    return;
  }
  try {
    res.json(await usoDelTenant(tenantId, giorniDi(req)));
  } catch (error: any) {
    console.error('Errore nel riepilogo dell\'uso:', error.message);
    res.status(500).json({ message: 'Errore interno del server' });
  }
};

/** GET /uso/tenant?giorni=.. — ultimo uso di ogni tenant (lista dei tenant) */
export const usoDeiTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ultimoUsoDeiTenant(giorniDi(req)));
  } catch (error: any) {
    console.error('Errore nell\'ultimo uso dei tenant:', error.message);
    res.status(500).json({ message: 'Errore interno del server' });
  }
};
