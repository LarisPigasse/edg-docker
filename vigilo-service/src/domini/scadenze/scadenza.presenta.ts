// =============================================================================
// Scadenze e registrazioni — come escono dalle API
// =============================================================================
// Lo stato arriva con il testo pronto ("tra 8 giorni · 30 ott") e, nel
// dettaglio, le impostazioni effettive con la loro ORIGINE (dal controllo o
// personalizzate): e' l'ereditarieta' visibile del passo 7.
// Gli importi escono solo a chi ha vigilo.costi (06-servizio-api 6.3).
// `segnalata`: c'è una segnalazione dell'addetto da confermare (B9c).
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { descriviCadenza, descriviPreavvisi, descriviTolleranza, testoStato, type ImpostazioniEffettive, type Situazione } from '../../regole';
import type { Registrazione } from '../registrazioni/registrazione.model';
import { presentaContatore, riferimentoSoggetto } from '../soggetti/soggetto.presenta';
import { etichetteDate } from '../valori';
import type { Scadenza } from './scadenza.model';

export function presentaScadenza(s: Scadenza, sit: Situazione, ctx: Contesto, segnalata = false) {
  const unita = s.contatore?.unita ?? null;
  return {
    uuid: s.uuidScadenza,
    titolo: s.titolo || s.controllo?.nome || '',
    soggetto: s.soggetto ? riferimentoSoggetto(s.soggetto) : null,
    controllo: s.controllo ? { uuid: s.controllo.uuidControllo, nome: s.controllo.nome, natura: s.controllo.natura } : null,
    scadeIl: s.scadeIl ?? null,
    sogliaUso: s.sogliaUso ?? null,
    contatore: s.contatore ? presentaContatore(s.contatore) : null,
    stato: s.stato,
    testo: testoStato(sit, s.scadeIl ?? null, unita, ctx.oggi),
    limiteIl: s.limiteIl ?? null,
    stimataIl: s.stimataIl ?? null,
    urgenzaIl: s.urgenzaIl ?? null,
    fineIl: s.fineIl ?? null,
    ripetizioniRimaste: s.ripetizioniRimaste ?? null,
    chiusa: s.chiusaIl ? { il: s.chiusaIl, motivo: s.motivoChiusura } : null,
    note: s.note ?? null,
    segnalata,
  };
}

export function presentaImpostazioni(eff: ImpostazioniEffettive, s: Scadenza) {
  const unita = eff.cadenza.uso?.unita ?? null;
  return {
    cadenza: eff.cadenza,
    preavvisi: eff.preavvisi,
    tolleranza: eff.tolleranza,
    destinatari: eff.destinatari,
    origine: eff.origine,
    frasi: {
      cadenza: descriviCadenza(eff.cadenza, s.soggetto ? etichetteDate(s.soggetto.tipo) : {}),
      preavvisi: descriviPreavvisi(eff.preavvisi, unita),
      tolleranza: descriviTolleranza(eff.tolleranza, unita),
    },
  };
}

export function presentaRegistrazione(r: Registrazione, ctx: Contesto) {
  return {
    uuid: r.uuidRegistrazione,
    tipo: r.tipo,
    stato: r.stato,
    eseguitaIl: r.eseguitaIl,
    esito: r.esito ?? null,
    dataPrecedente: r.dataPrecedente ?? null,
    dataNuova: r.dataNuova ?? null,
    lettura: r.lettura ?? null,
    ...(ctx.capacita.costi ? { importo: r.importo ?? null } : {}),
    fornitore: r.fornitore ? { uuid: r.fornitore.uuidFornitore, nome: r.fornitore.nome } : null,
    riferimento: r.riferimento ?? null,
    motivo: r.motivo ?? null,
    note: r.note ?? null,
    registrataIl: r.createdAt,
    /** Respinta: perché (B9c) */
    motivoRifiuto: r.motivoRifiuto ?? null,
    /** L'ha inserita l'utente (l'addetto ritira solo le sue segnalazioni) */
    tua: r.creatoDa === ctx.utente.id,
  };
}

/** La risposta di una registrazione che chiude o sposta la scadenza (Registra, conferma di una segnalazione) */
export function presentaEsecuzione(ctx: Contesto, e: { registrazione: Registrazione; scadenza: Scadenza; successiva: Scadenza | null }) {
  const { registrazione, scadenza, successiva } = e;
  return {
    registrazione: presentaRegistrazione(registrazione, ctx),
    scadenza: { uuid: scadenza.uuidScadenza, chiusa: scadenza.chiusaIl ? { il: scadenza.chiusaIl, motivo: scadenza.motivoChiusura } : null, scadeIl: scadenza.scadeIl ?? null },
    successiva: successiva ? { uuid: successiva.uuidScadenza, scadeIl: successiva.scadeIl ?? null, sogliaUso: successiva.sogliaUso ?? null, stato: successiva.stato } : null,
  };
}
