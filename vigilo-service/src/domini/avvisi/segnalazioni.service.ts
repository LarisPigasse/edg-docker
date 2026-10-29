// =============================================================================
// Avvisi delle segnalazioni dell'addetto (B9c, ADR101)
// =============================================================================
//   avvisaSegnalazione  all'ufficio che può confermare (vigilo.write), con i
//                       filtri delle sue preferenze per tipo di soggetto e sede
//   avvisaEsito         a chi l'ha mandata: confermata o respinta (col motivo)
//   risolviSegnalazione l'avviso all'ufficio non serve più (decisa o ritirata)
// Non urgenti; creazione e consegne in immediati.service.
// =============================================================================
import { oggiInItalia } from '../../core/utils/oggi';
import { Avviso, Consegna, Controllo, Registrazione, Scadenza, Soggetto } from '../modelli';
import { eventoEsito, eventoSegnalazione, statoEsito, statoSegnalazione, type EsitoSegnalazione } from '../segnalazioni/segnalazioni';
import { nomeDellAccount } from '../soggetti/account.service';
import { creaAvviso, preferenzeDi, testoDi, ufficioCheScrive } from './immediati.service';

export { dopo } from './immediati.service';

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

export async function avvisaSegnalazione(idRegistrazione: number, oggi = oggiInItalia()): Promise<void> {
  const r = await caricaRegistrazione(idRegistrazione);
  if (!r || r.stato !== 'da-confermare') return;
  const s = r.scadenza;
  const [di, chi] = await Promise.all([preferenzeDi(s.idTenant), nomeDellAccount(s.idTenant, r.creatoDa)]);
  const ufficio = await ufficioCheScrive(s.idTenant, s.soggetto, r.creatoDa ?? null, di);
  const testo = testoDi(s, statoSegnalazione(r.eseguitaIl, chi, oggi));
  await creaAvviso(s, { evento: eventoSegnalazione(r.idRegistrazione), tipo: 'segnalazione', testo, urgente: false, account: ufficio }, di);
}

export async function avvisaEsito(idRegistrazione: number, esito: EsitoSegnalazione, oggi = oggiInItalia()): Promise<void> {
  const r = await caricaRegistrazione(idRegistrazione);
  if (!r?.creatoDa) return;
  const di = await preferenzeDi(r.idTenant);
  const testo = testoDi(r.scadenza, statoEsito(esito, r.eseguitaIl, r.motivoRifiuto ?? null, oggi));
  await creaAvviso(r.scadenza, { evento: eventoEsito(esito, r.idRegistrazione), tipo: 'esito', testo, urgente: false, account: [r.creatoDa] }, di);
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
