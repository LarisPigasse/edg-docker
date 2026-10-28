// =============================================================================
// Avvisi delle segnalazioni dell'addetto (B9c, ADR101)
// =============================================================================
//   avvisaSegnalazione  all'ufficio che può confermare (vigilo.write), con i
//                       filtri delle sue preferenze per tipo di soggetto e sede
//   avvisaEsito         a chi l'ha mandata: confermata o respinta (col motivo)
//   risolviSegnalazione l'avviso all'ufficio non serve più (decisa o ritirata)
// In app subito, per email secondo le preferenze (non sono urgenti). Si
// chiamano dopo il commit e non fanno fallire la richiesta: se auth-service
// non risponde l'avviso all'ufficio si perde, ma la segnalazione resta ben
// visibile in elenco e in dashboard ("Da confermare").
// =============================================================================
import { UniqueConstraintError } from 'sequelize';
import { accountTenant } from '../../core/clients/authClient';
import { capacitaDi } from '../../core/middleware/permessi';
import { logger } from '../../core/services/logger';
import { oggiInItalia } from '../../core/utils/oggi';
import { riferimentoCiclo } from '../../regole';
import { Avviso, Consegna, Controllo, Registrazione, Scadenza, Soggetto } from '../modelli';
import { eventoEsito, eventoSegnalazione, statoEsito, statoSegnalazione, type EsitoSegnalazione } from '../segnalazioni/segnalazioni';
import { nomeDellAccount } from '../soggetti/account.service';
import { invioEmail } from './invio';
import { segnalaInvio } from './invio.service';
import { PREFERENZE_PREDEFINITE, passaFiltri, type Preferenze } from './preferenze';
import { preferenzeDelTenant } from './preferenze.service';
import { testoAvviso } from './testo';

async function caricaRegistrazione(idRegistrazione: number): Promise<(Registrazione & { scadenza: Scadenza }) | null> {
  const r = await Registrazione.findByPk(idRegistrazione, {
    include: [
      {
        model: Scadenza,
        as: 'scadenza',
        required: true,
        include: [
          { model: Soggetto, as: 'soggetto' },
          { model: Controllo, as: 'controllo', attributes: ['nome'] },
        ],
      },
    ],
  });
  return (r as (Registrazione & { scadenza: Scadenza }) | null) ?? null;
}

const testoDi = (s: Scadenza, stato: string) =>
  testoAvviso({
    titolo: s.titolo || s.controllo?.nome || 'Scadenza',
    soggetto: s.soggetto ? { nome: s.soggetto.nome, identificativo: s.soggetto.identificativo ?? null } : null,
    stato,
  });

/** Un avviso e le sue consegne: in app a tutti, per email a chi la vuole */
async function crea(s: Scadenza, evento: string, tipo: string, testo: string, account: number[], preferenze: (id: number) => Preferenze): Promise<void> {
  if (!account.length) return;
  let avviso: Avviso;
  try {
    avviso = await Avviso.create({
      idTenant: s.idTenant,
      idScadenza: s.idScadenza,
      evento,
      tipo,
      urgente: false,
      riferimento: riferimentoCiclo(s.scadeIl ?? null, s.sogliaUso ?? null),
      testo,
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) return; // già dato
    throw err;
  }
  const adesso = new Date();
  const conEmail = account.filter(id => invioEmail(preferenze(id), false) !== 'mai');
  await Consegna.bulkCreate([
    ...account.map(idAccount => ({ idTenant: s.idTenant, idAvviso: avviso.idAvviso, idAccount, canale: 'app' as const, stato: 'inviato' as const, inviatoIl: adesso })),
    ...conEmail.map(idAccount => ({ idTenant: s.idTenant, idAvviso: avviso.idAvviso, idAccount, canale: 'email' as const, stato: 'in-coda' as const })),
  ]);
  if (conEmail.length) segnalaInvio();
}

export async function avvisaSegnalazione(idRegistrazione: number, oggi = oggiInItalia()): Promise<void> {
  const r = await caricaRegistrazione(idRegistrazione);
  if (!r || r.stato !== 'da-confermare') return;
  const s = r.scadenza;
  const [account, preferenze, chi] = await Promise.all([accountTenant(s.idTenant), preferenzeDelTenant(s.idTenant), nomeDellAccount(s.idTenant, r.creatoDa)]);
  const di = (id: number) => preferenze.get(id) ?? PREFERENZE_PREDEFINITE;
  const sog = s.soggetto;
  const filtrabile = sog ? { idSoggetto: sog.idSoggetto, tipo: sog.tipo, idSede: sog.idSede ?? null } : null;
  const ufficio = account
    .filter(a => a.id !== r.creatoDa && capacitaDi(a.permissions).write)
    .map(a => a.id)
    .filter(id => passaFiltri(di(id).filtri, filtrabile));
  await crea(s, eventoSegnalazione(r.idRegistrazione), 'segnalazione', testoDi(s, statoSegnalazione(r.eseguitaIl, chi, oggi)), ufficio, di);
}

export async function avvisaEsito(idRegistrazione: number, esito: EsitoSegnalazione, oggi = oggiInItalia()): Promise<void> {
  const r = await caricaRegistrazione(idRegistrazione);
  if (!r?.creatoDa) return;
  const preferenze = await preferenzeDelTenant(r.idTenant);
  const di = (id: number) => preferenze.get(id) ?? PREFERENZE_PREDEFINITE;
  const testo = testoDi(r.scadenza, statoEsito(esito, r.eseguitaIl, r.motivoRifiuto ?? null, oggi));
  await crea(r.scadenza, eventoEsito(esito, r.idRegistrazione), 'esito', testo, [r.creatoDa], di);
}

/** L'avviso all'ufficio non serve più: le consegne visibili o in coda passano a "risolto" */
export async function risolviSegnalazione(idTenant: number, idRegistrazione: number): Promise<number> {
  const avvisi = await Avviso.findAll({ where: { idTenant, evento: eventoSegnalazione(idRegistrazione) }, attributes: ['idAvviso'] });
  if (!avvisi.length) return 0;
  const idAvviso = avvisi.map(a => a.idAvviso);
  // come risolviSuperati: le email già inviate restano "inviato"
  const [app] = await Consegna.update({ stato: 'risolto' }, { where: { idAvviso, canale: 'app', stato: ['inviato', 'letto'] }, validate: false }); // L054
  const [email] = await Consegna.update({ stato: 'risolto' }, { where: { idAvviso, canale: 'email', stato: 'in-coda' }, validate: false });
  return app + email;
}

/** Dopo il commit, senza far fallire la richiesta */
export function dopo(cosa: string, lavoro: () => Promise<unknown>): void {
  lavoro().catch(err => logger.warn('vigilo.avvisi', `Avvisi della segnalazione non dati (${cosa}): ${String(err)}`));
}
