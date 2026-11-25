// =============================================================================
// Uso della piattaforma per tenant (fase 2 dei log — ADR117)
// =============================================================================
// Che cosa fanno le persone di un tenant nei moduli: accessi (gateway, ADR118),
// consultazioni (servizi, ADR119) e modifiche (audit DATA/AUDIT), per modulo e
// per persona, in un periodo; e l'ultimo uso di ogni tenant per la lista.
// Solo eventi di persone (origine utente). Ciò che il personale EDG fa nel
// tenant in accesso assistito (azione.dettagli.assistenza) si conta a parte:
// non è uso del cliente. I login riusciti contano come uso della piattaforma.
// =============================================================================
import AzioneLog from '../models/azioneLog';

const ACCESSO = /\.accesso$/;
const CONSULTAZIONE = /\.consultazione$/;
const MODIFICHE = ['DATA', 'AUDIT'];
const LOGIN = 'auth.login_success';

/** Condizioni MongoDB riusate nelle aggregazioni */
const tipo = { $ifNull: ['$sottoCategoria', ''] };
const eAccesso = { $regexMatch: { input: tipo, regex: ACCESSO } };
const eConsultazione = { $regexMatch: { input: tipo, regex: CONSULTAZIONE } };
const eModifica = { $in: ['$categoria', MODIFICHE] };
const eLogin = { $eq: ['$sottoCategoria', LOGIN] };
const conta = (cond: unknown) => ({ $sum: { $cond: [cond, 1, 0] } });

/** Che cosa conta come uso (per l'ultimo uso): accessi, consultazioni, modifiche, login */
const DI_USO = {
  $or: [{ sottoCategoria: ACCESSO }, { sottoCategoria: CONSULTAZIONE }, { categoria: { $in: MODIFICHE } }, { sottoCategoria: LOGIN }],
};

const DI_PERSONE = { 'origine.tipo': 'utente' };
const IN_ASSISTENZA = { 'azione.dettagli.assistenza': { $exists: true, $ne: null } };
const NON_IN_ASSISTENZA = { 'azione.dettagli.assistenza': { $in: [null] } };

/** Inizio del periodo: `giorni` giorni fa (pura) */
export const inizioPeriodo = (giorni: number, adesso = new Date()): Date => new Date(adesso.getTime() - giorni * 86_400_000);

export interface UsoModulo {
  modulo: string;
  accessi: number;
  consultazioni: number;
  modifiche: number;
  persone: number;
  ultimoAccesso: Date | null;
  ultimoUso: Date | null;
}

export interface UsoPersona {
  accountId: string;
  email: string | null;
  accessi: number;
  consultazioni: number;
  modifiche: number;
  login: number;
  moduli: string[];
  ultimoUso: Date | null;
}

export interface UsoAssistenza {
  eventi: number;
  accessi: number;
  consultazioni: number;
  operatori: string[];
  ultimo: Date | null;
}

export interface UsoTenant {
  tenantId: number;
  giorni: number;
  dal: Date;
  al: Date;
  moduli: UsoModulo[];
  persone: UsoPersona[];
  assistenza: UsoAssistenza;
}

/** Il riepilogo di un tenant negli ultimi `giorni` giorni */
export async function usoDelTenant(tenantId: number, giorni: number, adesso = new Date()): Promise<UsoTenant> {
  const dal = inizioPeriodo(giorni, adesso);
  const base = { ...DI_PERSONE, 'origine.dettagli.tenantId': tenantId, timestamp: { $gte: dal, $lte: adesso } };

  const [moduli, persone, assistenza] = await Promise.all([
    AzioneLog.aggregate([
      // solo eventi d'uso: le richieste tecniche (http_request) delle persone non contano
      { $match: { ...base, ...NON_IN_ASSISTENZA, ...DI_USO, modulo: { $ne: null } } },
      {
        $group: {
          _id: '$modulo',
          accessi: conta(eAccesso),
          consultazioni: conta(eConsultazione),
          modifiche: conta(eModifica),
          persone: { $addToSet: '$origine.id' },
          ultimoAccesso: { $max: { $cond: [eAccesso, '$timestamp', null] } },
          ultimoUso: { $max: '$timestamp' },
        },
      },
      { $project: { _id: 0, modulo: '$_id', accessi: 1, consultazioni: 1, modifiche: 1, persone: { $size: '$persone' }, ultimoAccesso: 1, ultimoUso: 1 } },
      { $sort: { modulo: 1 } },
    ]),
    AzioneLog.aggregate([
      { $match: { ...base, ...NON_IN_ASSISTENZA, ...DI_USO } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$origine.id',
          email: { $first: '$origine.dettagli.email' },
          accessi: conta(eAccesso),
          consultazioni: conta(eConsultazione),
          modifiche: conta(eModifica),
          login: conta(eLogin),
          moduli: { $addToSet: '$modulo' },
          ultimoUso: { $max: '$timestamp' },
        },
      },
      { $sort: { ultimoUso: -1 } },
    ]),
    AzioneLog.aggregate([
      { $match: { ...base, ...IN_ASSISTENZA } },
      {
        $group: {
          _id: null,
          eventi: { $sum: 1 },
          accessi: conta(eAccesso),
          consultazioni: conta(eConsultazione),
          operatori: { $addToSet: '$azione.dettagli.assistenza.operatore.nome' },
          ultimo: { $max: '$timestamp' },
        },
      },
    ]),
  ]);

  const a = assistenza[0];
  return {
    tenantId,
    giorni,
    dal,
    al: adesso,
    moduli,
    persone: persone.map(p => ({
      accountId: String(p._id),
      email: p.email ?? null,
      accessi: p.accessi,
      consultazioni: p.consultazioni,
      modifiche: p.modifiche,
      login: p.login,
      moduli: (p.moduli as (string | null)[]).filter((m): m is string => !!m).sort(),
      ultimoUso: p.ultimoUso ?? null,
    })),
    assistenza: a
      ? { eventi: a.eventi, accessi: a.accessi, consultazioni: a.consultazioni, operatori: (a.operatori as (string | null)[]).filter((o): o is string => !!o).sort(), ultimo: a.ultimo }
      : { eventi: 0, accessi: 0, consultazioni: 0, operatori: [], ultimo: null },
  };
}

export interface UltimoUsoTenant {
  tenantId: number;
  /** Ultimo uso di sempre (accesso, consultazione, modifica o login) */
  ultimoUso: Date | null;
  /** Nel periodo */
  accessi: number;
  persone: number;
}

/** Per la lista dei tenant: ultimo uso di sempre e attività nel periodo */
export async function ultimoUsoDeiTenant(giorni: number, adesso = new Date()): Promise<{ giorni: number; tenant: UltimoUsoTenant[] }> {
  const dal = inizioPeriodo(giorni, adesso);
  const nelPeriodo = { $gte: ['$timestamp', dal] };
  const righe = await AzioneLog.aggregate([
    { $match: { ...DI_PERSONE, ...NON_IN_ASSISTENZA, ...DI_USO, 'origine.dettagli.tenantId': { $type: 'number' } } },
    {
      $group: {
        _id: '$origine.dettagli.tenantId',
        ultimoUso: { $max: '$timestamp' },
        accessi: conta({ $and: [nelPeriodo, eAccesso] }),
        persone: { $addToSet: { $cond: [nelPeriodo, '$origine.id', '$$REMOVE'] } },
      },
    },
    { $project: { _id: 0, tenantId: '$_id', ultimoUso: 1, accessi: 1, persone: { $size: '$persone' } } },
  ]);
  return { giorni, tenant: righe };
}
