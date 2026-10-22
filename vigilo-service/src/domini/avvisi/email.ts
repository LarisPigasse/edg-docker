// =============================================================================
// Ciò che serve alle email degli avvisi, condiviso fra invio subito e
// riepilogo (ADR092-ADR093)
// =============================================================================
//   INCLUDE_AVVISO   l'avviso con scadenza, soggetto e controllo
//   preferenzeDi     preferenze degli account delle consegne
//   indirizziDi      nome ed email degli account, letti da auth all'invio
//   voceDi           titolo, soggetto, stato, tono e link di un avviso
//   esitoInvio       aggiorna le consegne dopo un invio riuscito o no
// =============================================================================
import type { Includeable } from 'sequelize';
import { nomiAccount, type NomeAccount } from '../../core/clients/authClient';
import { PARAMETRI } from '../../core/parametri';
import { Avviso, Consegna, Controllo, PreferenzeAvvisi, Scadenza, Soggetto } from '../modelli';
import { PREFERENZE_INIZIALI, nomeSoggetto, percorsoScadenza, type PreferenzeEmail } from './invio';
import { statoDelTesto, tonoAvviso, type TonoAvviso } from './testo';

export const APP_FRONTEND_URL = (process.env.APP_FRONTEND_URL || 'http://localhost:5174').replace(/\/$/, '');
/** nomiAccount ne legge al massimo 64 per volta (limite fisso della rotta) */
const PER_CHIAMATA = 64;

export const INCLUDE_AVVISO: Includeable = {
  model: Avviso,
  as: 'avviso',
  required: true,
  include: [
    {
      model: Scadenza,
      as: 'scadenza',
      attributes: ['uuidScadenza', 'titolo'],
      include: [
        { model: Soggetto, as: 'soggetto', attributes: ['uuidSoggetto', 'nome', 'identificativo'] },
        { model: Controllo, as: 'controllo', attributes: ['nome'] },
      ],
    },
  ],
};

/** Preferenze degli account delle consegne; chiave `idTenant:idAccount` */
export async function preferenzeDi(consegne: Consegna[]): Promise<Map<string, PreferenzeEmail>> {
  const ids = [...new Set(consegne.filter(c => c.idAccount != null).map(c => c.idAccount!))];
  if (!ids.length) return new Map();
  const righe = await PreferenzeAvvisi.findAll({ where: { idAccount: ids } });
  return new Map(righe.map(r => [`${r.idTenant}:${r.idAccount}`, { frequenza: r.frequenza, urgentiSubito: r.urgentiSubito, canali: r.canali }]));
}

/** Le preferenze di una consegna (le persone senza account hanno i predefiniti) */
export const preferenzeDella = (c: Consegna, mappa: Map<string, PreferenzeEmail>): PreferenzeEmail =>
  c.idAccount != null ? (mappa.get(`${c.idTenant}:${c.idAccount}`) ?? PREFERENZE_INIZIALI) : PREFERENZE_INIZIALI;

/** Nome ed email degli account, a gruppi di 64; lancia se auth non risponde */
export async function indirizziDi(ids: number[]): Promise<Map<number, NomeAccount>> {
  const unici = [...new Set(ids)];
  const mappa = new Map<number, NomeAccount>();
  for (let i = 0; i < unici.length; i += PER_CHIAMATA) {
    for (const a of await nomiAccount(unici.slice(i, i + PER_CHIAMATA))) mappa.set(a.id, a);
  }
  return mappa;
}

export interface VoceEmail {
  titolo: string;
  soggetto: string | null;
  stato: string;
  tono: TonoAvviso;
  urgente: boolean;
  /** Solo per chi ha un account */
  url: string | null;
}

export function voceDi(a: Avviso, conLink: boolean): VoceEmail {
  const s = a.scadenza ?? null;
  const stato = statoDelTesto(a.testo);
  return {
    titolo: s?.titolo || s?.controllo?.nome || a.testo.slice(0, Math.max(0, a.testo.length - stato.length - 2)),
    soggetto: nomeSoggetto(s?.soggetto),
    stato,
    tono: tonoAvviso(a.evento, a.urgente),
    urgente: a.urgente,
    url: conLink && s ? `${APP_FRONTEND_URL}${percorsoScadenza(s.uuidScadenza, s.soggetto?.uuidSoggetto ?? null)}` : null,
  };
}

/** Dopo un invio: riuscito → inviato; non riuscito → tentativi+1, "fallito" al limite. Restituisce true se è "fallito". */
export async function esitoInvio(consegne: Consegna[], errore: unknown | null): Promise<boolean> {
  if (!consegne.length) return false;
  const ids = consegne.map(c => c.idConsegna);
  if (errore === null) {
    // update di massa: validate false (L054); tentativi +1 per ognuna
    await Consegna.update({ stato: 'inviato', inviatoIl: new Date(), errore: null }, { where: { idConsegna: ids }, validate: false });
    await Consegna.increment('tentativi', { where: { idConsegna: ids } });
    return false;
  }
  const tentativi = Math.max(...consegne.map(c => c.tentativi)) + 1;
  const fallita = tentativi >= PARAMETRI.tentativiEmail;
  await Consegna.update(
    { stato: fallita ? 'fallito' : 'in-coda', errore: String(errore).slice(0, 1024) },
    { where: { idConsegna: ids }, validate: false }
  );
  await Consegna.increment('tentativi', { where: { idConsegna: ids } });
  return fallita;
}
