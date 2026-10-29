// =============================================================================
// Avvisi immediati: nati da un'azione, non dal calendario (B9c, B10a)
// =============================================================================
// Le segnalazioni dell'addetto e i guasti avvisano subito, senza aspettare il
// giro degli avvisi: in app a tutti i destinatari, per email a chi la vuole
// secondo le sue preferenze (urgente = parte subito per chi ha scelto
// "urgenti subito"). Si chiamano dopo il commit e non fanno fallire la
// richiesta (dopo): se auth-service non risponde l'avviso si perde, ma la
// cosa resta visibile in elenco e in dashboard.
// =============================================================================
import { UniqueConstraintError } from 'sequelize';
import { accountTenant } from '../../core/clients/authClient';
import { capacitaDi } from '../../core/middleware/permessi';
import { logger } from '../../core/services/logger';
import { riferimentoCiclo } from '../../regole';
import { Avviso, Consegna, type Scadenza, type Soggetto } from '../modelli';
import { invioEmail } from './invio';
import { segnalaInvio } from './invio.service';
import { PREFERENZE_PREDEFINITE, passaFiltri, type Preferenze } from './preferenze';
import { preferenzeDelTenant } from './preferenze.service';
import { testoAvviso } from './testo';

/** Le preferenze degli account del tenant, con il predefinito per chi non le ha salvate */
export async function preferenzeDi(idTenant: number): Promise<(idAccount: number) => Preferenze> {
  const preferenze = await preferenzeDelTenant(idTenant);
  return id => preferenze.get(id) ?? PREFERENZE_PREDEFINITE;
}

/** L'ufficio che può intervenire (vigilo.write), con i filtri delle preferenze sul soggetto, senza chi ha fatto l'azione */
export async function ufficioCheScrive(idTenant: number, sog: Soggetto | null | undefined, escludi: number | null, di: (id: number) => Preferenze): Promise<number[]> {
  const filtrabile = sog ? { idSoggetto: sog.idSoggetto, tipo: sog.tipo, idSede: sog.idSede ?? null } : null;
  return (await accountTenant(idTenant))
    .filter(a => a.id !== escludi && capacitaDi(a.permissions).write)
    .map(a => a.id)
    .filter(id => passaFiltri(di(id).filtri, filtrabile));
}

/** Il testo dell'avviso di una scadenza (con titolo, soggetto e controllo caricati) */
export const testoDi = (s: Scadenza, stato: string): string =>
  testoAvviso({
    titolo: s.titolo || s.controllo?.nome || 'Scadenza',
    soggetto: s.soggetto ? { nome: s.soggetto.nome, identificativo: s.soggetto.identificativo ?? null } : null,
    stato,
  });

export interface NuovoAvvisoImmediato {
  evento: string;
  tipo: string;
  testo: string;
  urgente: boolean;
  account: number[];
}

/** Un avviso e le sue consegne: in app a tutti, per email a chi la vuole. Un evento già dato non si ripete */
export async function creaAvviso(s: Scadenza, a: NuovoAvvisoImmediato, preferenze: (id: number) => Preferenze): Promise<void> {
  if (!a.account.length) return;
  let avviso: Avviso;
  try {
    avviso = await Avviso.create({
      idTenant: s.idTenant,
      idScadenza: s.idScadenza,
      evento: a.evento,
      tipo: a.tipo,
      urgente: a.urgente,
      riferimento: riferimentoCiclo(s.scadeIl ?? null, s.sogliaUso ?? null),
      testo: a.testo,
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) return;
    throw err;
  }
  const adesso = new Date();
  const conEmail = a.account.filter(id => invioEmail(preferenze(id), a.urgente) !== 'mai');
  await Consegna.bulkCreate([
    ...a.account.map(idAccount => ({ idTenant: s.idTenant, idAvviso: avviso.idAvviso, idAccount, canale: 'app' as const, stato: 'inviato' as const, inviatoIl: adesso })),
    ...conEmail.map(idAccount => ({ idTenant: s.idTenant, idAvviso: avviso.idAvviso, idAccount, canale: 'email' as const, stato: 'in-coda' as const })),
  ]);
  if (conEmail.length) segnalaInvio();
}

/** Dopo il commit, senza far fallire la richiesta */
export function dopo(cosa: string, lavoro: () => Promise<unknown>): void {
  lavoro().catch(err => logger.warn('vigilo.avvisi', `Avviso non dato (${cosa}): ${String(err)}`));
}
