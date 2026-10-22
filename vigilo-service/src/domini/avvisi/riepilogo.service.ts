// =============================================================================
// Il riepilogo degli avvisi per email (04-avvisi 4.5, ADR093)
// =============================================================================
// Per ogni tenant avviato, al primo giro dopo il suo orario nei giorni
// lavorativi (riepilogoDovuto): un'email per destinatario con le voci in coda
// che vanno nel riepilogo (giornaliero; settimanale col primo riepilogo della
// settimana). In testa i numeri del tenant, come la dashboard; poi le voci in
// tre gruppi. Niente voci, niente email.
//   - consegne di chi nel frattempo ha scelto "mai" → "risolto";
//   - il tenant è "fatto" per oggi (ultimoRiepilogoIl) solo se non resta
//     niente da riprovare: i destinatari falliti si riprovano ai giri dopo;
//   - se auth non risponde, il tenant si riprova al giro dopo.
// =============================================================================
import { Op } from 'sequelize';
import type { NomeAccount } from '../../core/clients/authClient';
import { inviaEmail } from '../../core/clients/emailClient';
import { PARAMETRI } from '../../core/parametri';
import { minutiInItalia, oggiInItalia } from '../../core/utils/oggi';
import { nomeProprio } from '../avvio/pronto';
import { conteggi } from '../dashboard/dashboard.service';
import { avvisiEffettivi } from '../impostazioni/limiti';
import { Consegna, ImpostazioniTenant } from '../modelli';
import { APP_FRONTEND_URL, INCLUDE_AVVISO, esitoInvio, indirizziDi, preferenzeDella, preferenzeDi, voceDi } from './email';
import { invioEmail } from './invio';
import { nomiTenant } from './invio.service';
import { GRUPPI, gruppoDi, riepilogoDovuto, settimanaleDovuto } from './riepilogo';

export interface EsitoRiepiloghi {
  /** Tenant il cui riepilogo era dovuto */
  tenant: number;
  /** Email inviate (una per destinatario) */
  email: number;
  voci: number;
  fallite: number;
  rimandate: number;
}

/** I tenant avviati il cui riepilogo è dovuto adesso */
export async function tenantDaRiepilogare(adesso: Date = new Date()): Promise<ImpostazioniTenant[]> {
  const oggi = oggiInItalia(adesso);
  const minuti = minutiInItalia(adesso);
  const tutti = await ImpostazioniTenant.findAll({ where: { avviatoIl: { [Op.ne]: null } }, attributes: ['idTenant', 'avvisi', 'ultimoRiepilogoIl'] });
  return tutti.filter(t => riepilogoDovuto(avvisiEffettivi(t.avvisi), oggi, minuti, t.ultimoRiepilogoIl ?? null));
}

/** Le consegne email in coda del tenant (tutte: sono quelle nate dall'ultimo riepilogo) */
async function inCoda(idTenant: number): Promise<Consegna[]> {
  const tutte: Consegna[] = [];
  let ultimo = 0;
  for (;;) {
    const lotto = await Consegna.findAll({
      where: { idTenant, canale: 'email', stato: 'in-coda', idConsegna: { [Op.gt]: ultimo } },
      include: [INCLUDE_AVVISO],
      order: [['idConsegna', 'ASC']],
      limit: PARAMETRI.lotto,
    });
    tutte.push(...lotto);
    if (lotto.length < PARAMETRI.lotto) break;
    ultimo = lotto[lotto.length - 1].idConsegna;
  }
  return tutte;
}

/** "3 scadute · 2 in tolleranza · 5 entro 8 giorni · 12 entro 32 giorni · 4 da completare" (solo i numeri non zero) */
function numeriDi(n: Awaited<ReturnType<typeof conteggi>>): string {
  const parti: [number, string, string][] = [
    [n.scadute, 'scaduta', 'scadute'],
    [n.inTolleranza, 'in tolleranza', 'in tolleranza'],
    [n.entro8, 'entro 8 giorni', 'entro 8 giorni'],
    [n.entro32, 'entro 32 giorni', 'entro 32 giorni'],
    [n.daCompletare, 'da completare', 'da completare'],
  ];
  return parti.filter(([x]) => x > 0).map(([x, uno, molti]) => `${x} ${x === 1 ? uno : molti}`).join(' · ');
}

async function riepilogoTenant(t: ImpostazioniTenant, oggi: string, nomeTenant: (id: number) => Promise<string | null>, esito: EsitoRiepiloghi): Promise<void> {
  const idTenant = t.idTenant;
  const settimanale = settimanaleDovuto(oggi, t.ultimoRiepilogoIl ?? null);
  const coda = await inCoda(idTenant);
  const preferenze = await preferenzeDi(coda);

  const daMandare: Consegna[] = [];
  const nonPiu: number[] = [];
  for (const c of coda) {
    const quando = invioEmail(preferenzeDella(c, preferenze), c.avviso!.urgente);
    if (quando === 'giornaliero' || (quando === 'settimanale' && settimanale)) daMandare.push(c);
    else if (quando === 'mai') nonPiu.push(c.idConsegna);
    // 'subito' le manda invio.service; 'settimanale' fuori settimana resta in coda
  }
  if (nonPiu.length) await Consegna.update({ stato: 'risolto', errore: 'Preferenze: nessuna email' }, { where: { idConsegna: nonPiu }, validate: false });

  // per destinatario: l'account, oppure l'indirizzo di chi non ha account
  const perDestinatario = new Map<string, Consegna[]>();
  for (const c of daMandare) {
    const chiave = c.idAccount != null ? `a:${c.idAccount}` : `e:${c.email!.toLowerCase()}`;
    perDestinatario.set(chiave, [...(perDestinatario.get(chiave) ?? []), c]);
  }

  let rimandate = 0;
  if (perDestinatario.size) {
    let account: Map<number, NomeAccount>;
    try {
      account = await indirizziDi(daMandare.filter(c => c.idAccount != null).map(c => c.idAccount!));
    } catch {
      esito.rimandate += daMandare.length;
      return; // auth non risponde: il tenant si riprova al giro dopo
    }
    const numeri = numeriDi(await conteggi({ oggi }, { where: { idTenant }, include: [] }));
    const tenant = await nomeTenant(idTenant);

    for (const consegne of perDestinatario.values()) {
      const c0 = consegne[0];
      const persona = c0.idAccount != null ? account.get(c0.idAccount) : null;
      const to = c0.idAccount != null ? persona?.email?.trim() : c0.email;
      if (!to) {
        await Consegna.update({ stato: 'fallito', errore: 'Account non trovato o senza email' }, { where: { idConsegna: consegne.map(c => c.idConsegna) }, validate: false });
        esito.fallite += consegne.length;
        continue;
      }
      const conLink = c0.idAccount != null;
      const voci = consegne.map(c => voceDi(c.avviso!, conLink));
      const gruppi = GRUPPI.map(g => ({ ...g, voci: voci.filter(v => gruppoDi(v.tono) === g.chiave) })).filter(g => g.voci.length);
      let errore: unknown = null;
      try {
        await inviaEmail({
          to,
          subject: `Vigilo · ${voci.length === 1 ? '1 scadenza' : `${voci.length} scadenze`} da guardare${tenant ? ` · ${tenant}` : ''}`,
          template: 'vigilo/riepilogo',
          data: {
            oggetto: settimanale && consegne.some(c => invioEmail(preferenzeDella(c, preferenze), c.avviso!.urgente) === 'settimanale') ? 'Il riepilogo della settimana' : 'Il riepilogo di oggi',
            nome: persona?.nome ? nomeProprio(persona.nome) : null,
            tenant,
            numeri,
            gruppi,
            voci: voci.length,
            urlVigilo: conLink ? `${APP_FRONTEND_URL}/vigilo` : null,
          },
        });
      } catch (err) {
        errore = err;
      }
      const fallita = await esitoInvio(consegne, errore);
      if (errore === null) {
        esito.email++;
        esito.voci += consegne.length;
      } else if (fallita) esito.fallite += consegne.length;
      else rimandate += consegne.length;
    }
  }
  esito.rimandate += rimandate;
  // fatto per oggi solo se non resta niente da riprovare
  if (!rimandate) await t.update({ ultimoRiepilogoIl: oggi });
}

export async function inviaRiepiloghi(adesso: Date = new Date()): Promise<EsitoRiepiloghi> {
  const esito: EsitoRiepiloghi = { tenant: 0, email: 0, voci: 0, fallite: 0, rimandate: 0 };
  const oggi = oggiInItalia(adesso);
  const nomeTenant = nomiTenant();
  for (const t of await tenantDaRiepilogare(adesso)) {
    esito.tenant++;
    await riepilogoTenant(t, oggi, nomeTenant, esito);
  }
  return esito;
}
