// =============================================================================
// Stime salvate (2026-11-18, fase 3)
// =============================================================================
//   salvaStima      ricalcola dai dati (la regola è quella del servizio, non
//                   ciò che manda la pagina) e salva descrizione, dati,
//                   fotografia dei valori usati e risultato
//   elencoStime     le stime più recenti per prime, a pagine, con mezzo,
//                   persona, totale, costo reale e scostamento
//   leggiStima      una stima intera
//   registraReale   il costo reale dopo il servizio (null lo toglie), con note
//   registraPrezzo  il prezzo applicato al cliente (null lo toglie): margine
//   eliminaStima    la toglie: chi l'ha salvata o chi ha write
// Tutto con read e costi (rotte).
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { traccia } from '../../core/services/traccia';
import { ForbiddenError } from '../../core/utils/errors';
import { nomeAutore, nomiAutori, NESSUN_NOME, type NomiAutori } from '../soggetti/autori';
import { calcolaServizio, type RichiestaCalcolo } from './calcolo.service';
import { StimaCosti } from './stima.model';
import { descrizioneDi, margine, scostamento } from './stime';

interface UsatiSalvati {
  mezzo?: { nome?: string; identificativo?: string | null } | null;
  persona?: { nome?: string } | null;
}

/** Una riga dell'elenco: senza i dati interi */
function presentaRiga(s: StimaCosti, ctx: Contesto, nomi: NomiAutori) {
  const u = s.usati as UsatiSalvati;
  const r = s.risultato as { kmTotali?: number | null; oreServizio?: number };
  return {
    uuid: s.uuidStima,
    descrizione: s.descrizione,
    tipo: s.tipo,
    mezzo: u.mezzo?.nome ?? null,
    persona: u.persona?.nome ?? null,
    kmTotali: r.kmTotali ?? null,
    oreServizio: r.oreServizio ?? null,
    totale: s.totale,
    costoReale: s.costoReale,
    scostamento: scostamento(s.totale, s.costoReale),
    /** Prezzo applicato e margine, opzionali (2026-11-23) */
    prezzo: s.prezzo,
    margine: margine(s.prezzo, s.totale, s.costoReale),
    salvataIl: s.createdAt,
    salvataDa: nomeAutore(nomi, s.creatoDa),
    /** Può eliminarla chi la guarda: l'ha salvata lui o ha write */
    eliminabile: s.creatoDa === ctx.utente.id || ctx.capacita.write,
  };
}

/** Una stima intera: in più dati, valori usati, risultato e il costo reale con chi e quando */
function presenta(s: StimaCosti, ctx: Contesto, nomi: NomiAutori) {
  return {
    ...presentaRiga(s, ctx, nomi),
    dati: s.dati,
    usati: s.usati,
    risultato: s.risultato,
    noteReale: s.noteReale,
    realeIl: s.realeIl,
    realeDa: nomeAutore(nomi, s.realeDa),
  };
}

export async function salvaStima(ctx: Contesto, q: RichiestaCalcolo & { descrizione?: string | null }) {
  const { descrizione, ...richiesta } = q;
  const c = await calcolaServizio(ctx, richiesta);
  const s = await StimaCosti.create({
    idTenant: ctx.idTenant,
    descrizione: descrizioneDi(descrizione, richiesta.tipo, richiesta.km, richiesta.oreLavoro),
    tipo: richiesta.tipo,
    dati: richiesta as unknown as Record<string, unknown>,
    usati: c.usati as unknown as Record<string, unknown>,
    risultato: c.risultato as unknown as Record<string, unknown>,
    totale: c.risultato.totale,
  });
  traccia(ctx, 'vigilo.stima.salvata', `Stima salvata: ${s.descrizione}`, null, { uuid: s.uuidStima, totale: s.totale });
  return presenta(s, ctx, await nomiAutori([s.creatoDa]));
}

export async function elencoStime(ctx: Contesto, p: { offset: number; righe: number }) {
  const { rows, count } = await StimaCosti.findAndCountAll({
    where: { idTenant: ctx.idTenant },
    order: [['createdAt', 'DESC'], ['idStima', 'DESC']],
    offset: p.offset,
    limit: p.righe,
  });
  const nomi = await nomiAutori(rows.map(s => s.creatoDa));
  return { elementi: rows.map(s => presentaRiga(s, ctx, nomi)), totale: count };
}

export async function leggiStima(ctx: Contesto, uuid: string) {
  const s = await trovaNelTenant(StimaCosti, 'uuidStima', uuid, ctx.idTenant, 'Stima');
  return presenta(s, ctx, await nomiAutori([s.creatoDa, s.realeDa]));
}

/** Il prezzo applicato al cliente (anche prima del servizio); null lo toglie (2026-11-23) */
export async function registraPrezzo(ctx: Contesto, uuid: string, d: { prezzo: number | null }) {
  const s = await trovaNelTenant(StimaCosti, 'uuidStima', uuid, ctx.idTenant, 'Stima');
  const prima = { prezzo: s.prezzo };
  await s.update({ prezzo: d.prezzo });
  traccia(ctx, 'vigilo.stima.prezzo', `Prezzo ${d.prezzo === null ? 'tolto' : 'registrato'}: ${s.descrizione}`, prima, { prezzo: s.prezzo });
  return presenta(s, ctx, await nomiAutori([s.creatoDa, s.realeDa]));
}

/** Il costo reale dopo il servizio; null lo toglie */
export async function registraReale(ctx: Contesto, uuid: string, d: { costoReale: number | null; note?: string | null }) {
  const s = await trovaNelTenant(StimaCosti, 'uuidStima', uuid, ctx.idTenant, 'Stima');
  const prima = { costoReale: s.costoReale, noteReale: s.noteReale };
  const note = typeof d.note === 'string' && d.note.trim() ? d.note.trim() : null;
  await s.update(
    d.costoReale === null
      ? { costoReale: null, noteReale: null, realeIl: null, realeDa: null }
      : { costoReale: d.costoReale, noteReale: note, realeIl: new Date(), realeDa: ctx.utente.id }
  );
  traccia(ctx, 'vigilo.stima.reale', `Costo reale ${d.costoReale === null ? 'tolto' : 'registrato'}: ${s.descrizione}`, prima, { costoReale: s.costoReale, noteReale: s.noteReale });
  return presenta(s, ctx, await nomiAutori([s.creatoDa, s.realeDa]));
}

export async function eliminaStima(ctx: Contesto, uuid: string) {
  const s = await trovaNelTenant(StimaCosti, 'uuidStima', uuid, ctx.idTenant, 'Stima');
  if (s.creatoDa !== ctx.utente.id && !ctx.capacita.write) throw new ForbiddenError('Può eliminarla chi l\'ha salvata o l\'ufficio');
  await s.destroy();
  traccia(ctx, 'vigilo.stima.eliminata', `Stima eliminata: ${s.descrizione}`, presenta(s, ctx, NESSUN_NOME), null);
}
