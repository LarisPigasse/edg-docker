// =============================================================================
// Avviso degli aggiornamenti della libreria — servizio (ADR074, B10b)
// =============================================================================
//   avvisaLibreria   dopo una sincronizzazione con versioni nuove o ritiri: un
//                    solo avviso per cliente con le voci in attesa; se l'insieme
//                    e' cambiato, il nuovo sostituisce il vecchio (che si chiude).
//                    In modo 'controllo' (giro notturno) lo crea solo se manca:
//                    rete di sicurezza se all'avvio auth-service non rispondeva,
//                    senza ripetere l'avviso a ogni decisione parziale.
//   chiudiSeFinito   dopo una decisione: se non resta niente, le consegne
//                    ancora aperte passano a "risolto"
// Destinatari: chi ha vigilo.config; email secondo le preferenze, mai urgente.
// =============================================================================
import { Op } from 'sequelize';
import { accountTenant } from '../../core/clients/authClient';
import { capacitaDi } from '../../core/middleware/permessi';
import { logger } from '../../core/services/logger';
import { creaAvvisoPer, preferenzeDi } from '../avvisi/immediati.service';
import { Avviso, Consegna, ImpostazioniTenant } from '../modelli';
import { proposteDelTenant } from './aggiornamenti.service';
import { EVENTO_LIBRERIA, TIPO_LIBRERIA, improntaAttesa, testoAvvisoLibreria } from './avvisoLibreria';

export type ModoAvviso = 'sincronizzazione' | 'controllo';
export type EsitoAvvisoLibreria = 'nuovo' | 'invariato' | 'chiuso' | 'nulla';

const APERTE = ['in-coda', 'inviato', 'letto'];

/** Gli avvisi della libreria del tenant con consegne ancora aperte */
const avvisiAperti = (idTenant: number) =>
  Avviso.findAll({
    where: { idTenant, idScadenza: null, evento: EVENTO_LIBRERIA },
    include: [{ model: Consegna, as: 'consegne', required: true, where: { stato: { [Op.in]: APERTE } }, attributes: ['idConsegna', 'canale', 'stato'] }],
  });

/** Chiude gli avvisi dati: la campanella e le email non ancora partite (le inviate restano "inviato") */
async function chiudi(avvisi: Avviso[]): Promise<number> {
  const ids = avvisi.flatMap(a => (a.consegne ?? []).filter(c => c.canale === 'app' || c.stato === 'in-coda').map(c => c.idConsegna));
  if (!ids.length) return 0;
  const [n] = await Consegna.update({ stato: 'risolto' }, { where: { idConsegna: ids }, validate: false }); // L054
  return n;
}

export async function avvisaLibreria(idTenant: number, modo: ModoAvviso = 'sincronizzazione'): Promise<EsitoAvvisoLibreria> {
  const { proposte } = await proposteDelTenant(idTenant);
  const aperti = await avvisiAperti(idTenant);
  if (!proposte.length) return (await chiudi(aperti)) ? 'chiuso' : 'nulla';

  const riferimento = improntaAttesa(proposte.map(p => ({ entita: p.entita, chiave: p.lib.chiave, versione: p.lib.versione, tipo: p.tipo })));
  if (aperti.some(a => a.riferimento === riferimento) || (modo === 'controllo' && aperti.length)) return 'invariato';

  const account = (await accountTenant(idTenant)).filter(a => capacitaDi(a.permissions).config).map(a => a.id);
  const nato = await creaAvvisoPer(
    { idTenant, idScadenza: null, riferimento },
    { evento: EVENTO_LIBRERIA, tipo: TIPO_LIBRERIA, urgente: false, testo: testoAvvisoLibreria(proposte.map(p => p.voce.nome)), account },
    await preferenzeDi(idTenant)
  );
  if (!nato) return 'invariato';
  await chiudi(aperti); // il nuovo sostituisce quelli di prima
  return 'nuovo';
}

/** Dopo una decisione: se non resta niente da decidere, l'avviso si chiude */
export async function chiudiSeFinito(idTenant: number): Promise<boolean> {
  const aperti = await avvisiAperti(idTenant);
  if (!aperti.length) return false;
  const { proposte } = await proposteDelTenant(idTenant);
  return !proposte.length && (await chiudi(aperti)) > 0;
}

/** Tutti i tenant avviati: dopo la sincronizzazione o nel giro notturno; un tenant che fallisce non ferma gli altri */
export async function avvisaLibreriaTutti(modo: ModoAvviso): Promise<Record<EsitoAvvisoLibreria | 'saltati', number>> {
  const tot = { nuovo: 0, invariato: 0, chiuso: 0, nulla: 0, saltati: 0 };
  const tenant = await ImpostazioniTenant.findAll({ where: { avviatoIl: { [Op.ne]: null } }, attributes: ['idTenant'] });
  for (const t of tenant) {
    try {
      tot[await avvisaLibreria(t.idTenant, modo)]++;
    } catch (err) {
      tot.saltati++;
      logger.warn('vigilo.avvisi', `Avviso della libreria del tenant ${t.idTenant} non dato: ${String(err)}`, { idTenant: t.idTenant });
    }
  }
  return tot;
}
