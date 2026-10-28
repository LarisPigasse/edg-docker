// =============================================================================
// Generazione degli avvisi (04-avvisi 4.2-4.3, ADR090)
// =============================================================================
// Per ogni scadenza aperta di un tenant: gli eventi dovuti oggi
// (regole/avvisi.ts) diventano righe di `avvisi`, uniche per scadenza +
// evento + ciclo: un avviso già dato non si ripete. A ogni avviso nuovo si
// risolvono i destinatari (destinatari.ts) e si creano le consegne:
//   - in app per gli account (subito "inviato": le legge la campanella);
//   - per email, in coda: agli account secondo le loro preferenze (ADR092),
//     con i filtri per tipo di soggetto e sede per chi riceve come ufficio (B8d-1),
//     alle persone senza account e agli indirizzi aggiuntivi sempre, salvo
//     chi ha chiesto di non ricevere più (B8d-4); le invia invio.service
//     (subito) o il riepilogo.
// Poi gli avvisi di cicli superati (scadenza registrata, rinviata, chiusa)
// passano a "risolto": niente campanelle accese per niente.
// Una scadenza con una segnalazione dell'addetto in attesa non manda altri
// avvisi: la cosa da fare è confermarla, e l'ufficio ne ha già l'avviso (B9c).
// Gli avvisi delle segnalazioni hanno il loro ciclo (segnalazioni.service).
//
// Quando: ogni notte dopo il ricalcolo e, per un tenant, poco dopo ogni
// modifica che ricalcola le sue scadenze (segnalaModifica: attesa e lotto
// sono parametri della piattaforma, ADR093).
// Se auth-service non risponde (ufficio sconosciuto) il tenant si salta e si
// riprova al giro successivo: meglio un avviso in ritardo che uno perso.
// =============================================================================
import { Op, UniqueConstraintError } from 'sequelize';
import { capacitaDi } from '../../core/middleware/permessi';
import { accountTenant } from '../../core/clients/authClient';
import { PARAMETRI } from '../../core/parametri';
import { logger } from '../../core/services/logger';
import { oggiInItalia } from '../../core/utils/oggi';
import { eventiDovuti, riferimentoCiclo, testoStato, type Giorno } from '../../regole';
import { avvisiEffettivi } from '../impostazioni/limiti';
import { Assegnazione, Avviso, Consegna, Contatore, Controllo, ImpostazioniTenant, Registrazione, Scadenza, Soggetto } from '../modelli';
import { genereEvento } from '../segnalazioni/segnalazioni';
import { predefinitiDi, situazioneDi } from '../scadenze/ricalcolo.service';
import { risolviDestinatari, ufficioDa, type PersonaAvvisabile } from './destinatari';
import { invioEmail } from './invio';
import { inCorso, personaDi } from './persone';
import { segnalaInvio } from './invio.service';
import { PREFERENZE_PREDEFINITE, passaFiltri } from './preferenze';
import { preferenzeDelTenant } from './preferenze.service';
import { escluseDelTenant } from './recapiti.service';
import { testoAvviso } from './testo';

export interface EsitoGenerazione {
  avvisi: number;
  consegne: number;
  risolte: number;
}

export async function generaAvvisiTenant(idTenant: number, oggi: Giorno = oggiInItalia()): Promise<EsitoGenerazione> {
  const esito: EsitoGenerazione = { avvisi: 0, consegne: 0, risolte: 0 };
  const [imp, account] = await Promise.all([ImpostazioniTenant.findByPk(idTenant), accountTenant(idTenant)]);
  if (!imp?.avviatoIl) return esito;
  const { intervalloRichiami } = avvisiEffettivi(imp.avvisi);
  const ufficio = ufficioDa(account.map(a => ({ id: a.id, capacita: capacitaDi(a.permissions) })));
  const predefiniti = (await predefinitiDi([idTenant])).get(idTenant)!;
  const preferenze = await preferenzeDelTenant(idTenant);
  const di = (id: number) => preferenze.get(id) ?? PREFERENZE_PREDEFINITE;
  const escluse = await escluseDelTenant(idTenant);
  const segnalate = new Set(
    (await Registrazione.findAll({ where: { idTenant, stato: 'da-confermare' }, attributes: ['idScadenza'] })).map(r => r.idScadenza)
  );
  let email = 0;

  let ultimo = 0;
  for (;;) {
    const lotto = await Scadenza.findAll({
      where: { idTenant, chiusaIl: null, idScadenza: { [Op.gt]: ultimo } },
      include: [
        { model: Controllo, as: 'controllo' },
        { model: Contatore, as: 'contatore' },
        {
          model: Soggetto,
          as: 'soggetto',
          include: [
            { model: Soggetto, as: 'referente' },
            { model: Assegnazione, as: 'assegnazioni', required: false, include: [{ model: Soggetto, as: 'persona' }] },
          ],
        },
      ],
      order: [['idScadenza', 'ASC']],
      limit: PARAMETRI.lotto,
    });
    if (!lotto.length) break;

    for (const s of lotto) {
      const sog = s.soggetto ?? null;
      if (sog?.stato === 'dismesso' || segnalate.has(s.idScadenza)) continue;
      const { eff, sit } = situazioneDi(s, s.controllo, s.contatore, predefiniti, oggi);
      const eventi = eventiDovuti(
        { scadeIl: s.scadeIl ?? null, sogliaUso: s.sogliaUso ?? null, situazione: sit, preavvisi: eff.preavvisi, intervalloRichiami },
        oggi
      );
      if (!eventi.length) continue;

      const filtrabile = sog ? { idSoggetto: sog.idSoggetto, tipo: sog.tipo, idSede: sog.idSede ?? null } : null;
      const testo = testoAvviso({
        titolo: s.titolo || s.controllo?.nome || 'Scadenza',
        soggetto: sog ? { nome: sog.nome, identificativo: sog.identificativo ?? null } : null,
        stato: testoStato(sit, s.scadeIl ?? null, s.contatore?.unita ?? null, oggi),
      });

      for (const ev of eventi) {
        let avviso: Avviso;
        try {
          avviso = await Avviso.create({ idTenant, idScadenza: s.idScadenza, evento: ev.evento, tipo: ev.tipo, urgente: ev.urgente, riferimento: ev.riferimento, testo });
        } catch (err) {
          if (err instanceof UniqueConstraintError) continue; // già dato: non si ripete
          throw err;
        }
        esito.avvisi++;

        const recapiti = risolviDestinatari({
          destinatari: eff.destinatari,
          soggettoFermo: sog?.stato === 'fermo',
          avvisaAncheSeFermo: !!s.controllo?.avvisaAncheSeFermo,
          ufficio,
          referente: personaDi(sog?.referente),
          assegnatari: (sog?.assegnazioni ?? []).filter(a => inCorso(a, oggi)).map(a => personaDi(a.persona)).filter((p): p is PersonaAvvisabile => !!p),
          interessato: sog?.tipo === 'persona' ? personaDi(sog) : null,
          filtroUfficio: id => passaFiltri(di(id).filtri, filtrabile),
          escluse,
        });
        const adesso = new Date();
        // email agli account solo se le loro preferenze la vogliono, per questo avviso
        const conEmail = recapiti.account.filter(id => invioEmail(di(id), ev.urgente) !== 'mai');
        const righe = [
          ...recapiti.account.map(idAccount => ({ idTenant, idAvviso: avviso.idAvviso, idAccount, canale: 'app' as const, stato: 'inviato' as const, inviatoIl: adesso })),
          ...conEmail.map(idAccount => ({ idTenant, idAvviso: avviso.idAvviso, idAccount, canale: 'email' as const, stato: 'in-coda' as const })),
          ...recapiti.email.map(indirizzo => ({ idTenant, idAvviso: avviso.idAvviso, email: indirizzo, canale: 'email' as const, stato: 'in-coda' as const })),
        ];
        if (righe.length) await Consegna.bulkCreate(righe);
        esito.consegne += righe.length;
        email += conEmail.length + recapiti.email.length;
      }
    }
    ultimo = lotto[lotto.length - 1].idScadenza;
    if (lotto.length < PARAMETRI.lotto) break;
  }

  esito.risolte = await risolviSuperati(idTenant);
  // le urgenti (e chi vuole tutto subito) partono senza aspettare il giro successivo
  if (email) segnalaInvio();
  return esito;
}

/** Consegne ancora aperte di avvisi il cui ciclo è finito (scadenza chiusa o con data/soglia cambiate) */
async function risolviSuperati(idTenant: number): Promise<number> {
  const aperti = await Avviso.findAll({
    where: { idTenant, idScadenza: { [Op.ne]: null } },
    include: [
      { model: Consegna, as: 'consegne', required: true, where: { stato: { [Op.in]: ['in-coda', 'inviato', 'letto'] } }, attributes: ['idConsegna', 'canale', 'stato'] },
      { model: Scadenza, as: 'scadenza', attributes: ['idScadenza', 'scadeIl', 'sogliaUso', 'chiusaIl'] },
    ],
  });
  const ids: number[] = [];
  for (const a of aperti) {
    const s = a.scadenza;
    const genere = genereEvento(a.evento);
    if (genere === 'esito') continue; // l'esito di una segnalazione resta da leggere anche a scadenza chiusa
    const cicloCambiato = genere === null && a.riferimento !== riferimentoCiclo(s?.scadeIl ?? null, s?.sogliaUso ?? null);
    const superato = !s || !!s.chiusaIl || cicloCambiato;
    if (!superato) continue;
    // le email già inviate restano "inviato": si risolve ciò che è ancora visibile o in coda
    for (const c of a.consegne ?? []) if (c.canale === 'app' || c.stato === 'in-coda') ids.push(c.idConsegna);
  }
  if (!ids.length) return 0;
  const [n] = await Consegna.update({ stato: 'risolto' }, { where: { idConsegna: ids }, validate: false }); // L054
  return n;
}

/** Tutti i tenant avviati (processo notturno) */
export async function generaAvvisiTutti(oggi: Giorno = oggiInItalia()): Promise<EsitoGenerazione & { saltati: number }> {
  const tenant = await ImpostazioniTenant.findAll({ where: { avviatoIl: { [Op.ne]: null } }, attributes: ['idTenant'] });
  const tot = { avvisi: 0, consegne: 0, risolte: 0, saltati: 0 };
  for (const t of tenant) {
    try {
      const e = await generaAvvisiTenant(t.idTenant, oggi);
      tot.avvisi += e.avvisi;
      tot.consegne += e.consegne;
      tot.risolte += e.risolte;
    } catch (err) {
      tot.saltati++;
      logger.warn('vigilo.avvisi', `Avvisi del tenant ${t.idTenant} non generati: ${String(err)}`, { idTenant: t.idTenant });
    }
  }
  return tot;
}

// --- dopo una modifica: un giro per tenant, raggruppando le modifiche vicine ---

const inAttesa = new Map<number, NodeJS.Timeout>();
const inCorsoGiro = new Set<number>();

export function segnalaModifica(idTenant: number): void {
  const t = inAttesa.get(idTenant);
  if (t) clearTimeout(t);
  inAttesa.set(
    idTenant,
    setTimeout(() => {
      inAttesa.delete(idTenant);
      if (inCorsoGiro.has(idTenant)) {
        segnalaModifica(idTenant); // un giro alla volta: si riprova poco dopo
        return;
      }
      inCorsoGiro.add(idTenant);
      generaAvvisiTenant(idTenant)
        .catch(err => logger.warn('vigilo.avvisi', `Avvisi del tenant ${idTenant} non generati: ${String(err)}`, { idTenant }))
        .finally(() => inCorsoGiro.delete(idTenant));
    }, PARAMETRI.attesaModificaMs)
  );
}
