// =============================================================================
// Stima dei costi di un servizio — parametri (2026-11-17, fase 1)
// =============================================================================
//   leggiParametri   i parametri generali (con valori iniziali e limiti) e i
//                    costi aziendali di ogni anno, con totale, costo per ora
//                    di servizio e chi li ha aggiornati; l'anno che la stima
//                    userebbe oggi
//   cambiaGenerali   modifica parziale dei parametri generali
//   salvaAnno        crea o aggiorna i costi di un anno (consuntivo o preventivo)
//   eliminaAnno      toglie un anno
// Lettura con read e costi, scrittura con write e costi (rotte).
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { traccia } from '../../core/services/traccia';
import { NotFoundError, ValidationError } from '../../core/utils/errors';
import { LIMITI_STIMA, STIMA_INIZIALI, erroriStima, stimaEffettiva, type RegoleStima } from '../impostazioni/limiti';
import { ImpostazioniTenant } from '../modelli';
import { nomeAutore, nomiAutori } from '../soggetti/autori';
import { CostiAziendali } from './costiAziendali.model';
import { NOMI_VOCI_COSTI, VOCI_COSTI, annoDiRiferimento, costoPerOra, erroriAnno, totaleVoci, vociPulite, type DatiAnno, type StatoCosti } from './parametri';

export async function leggiParametri(ctx: Contesto) {
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant, { attributes: ['idTenant', 'stima'] });
  const righe = await CostiAziendali.findAll({ where: { idTenant: ctx.idTenant }, order: [['anno', 'DESC']] });
  const nomi = await nomiAutori(righe.map(r => r.modificatoDa ?? r.creatoDa));
  const annoCorrente = Number(ctx.oggi.slice(0, 4));
  return {
    generali: stimaEffettiva(imp?.stima),
    iniziali: STIMA_INIZIALI,
    limiti: LIMITI_STIMA,
    voci: VOCI_COSTI.map(v => ({ chiave: v, nome: NOMI_VOCI_COSTI[v] })),
    anni: righe.map(r => {
      const totale = totaleVoci(r.voci);
      return {
        uuid: r.uuidCosti,
        anno: r.anno,
        stato: r.stato,
        voci: r.voci,
        totale,
        oreServizio: r.oreServizio,
        /** Costo aziendale per ora di servizio; null senza ore */
        costoPerOra: costoPerOra(totale, r.oreServizio),
        note: r.note,
        aggiornatoIl: r.updatedAt,
        aggiornatoDa: nomeAutore(nomi, r.modificatoDa ?? r.creatoDa),
      };
    }),
    annoCorrente,
    /** L'anno che la stima userebbe oggi: quello in corso, o il più recente prima */
    annoDiRiferimento: annoDiRiferimento(righe.map(r => r.anno), annoCorrente),
    modificabili: ctx.capacita.write,
  };
}

/** Modifica parziale dei parametri generali */
export async function cambiaGenerali(ctx: Contesto, modifica: Partial<RegoleStima>) {
  const errori = erroriStima(modifica);
  if (errori.length) throw new ValidationError(errori.join('. '));
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant);
  if (!imp?.avviatoIl) throw new ValidationError('Vigilo non è ancora avviato per la tua azienda');
  const prima = stimaEffettiva(imp.stima);
  const dopo = stimaEffettiva({ ...prima, ...modifica });
  if (JSON.stringify(prima) !== JSON.stringify(dopo)) {
    await imp.update({ stima: dopo });
    traccia(ctx, 'vigilo.stima.parametri', 'Parametri della stima dei costi aggiornati', prima, dopo);
  }
  return leggiParametri(ctx);
}

/** Crea o aggiorna i costi aziendali di un anno */
export async function salvaAnno(ctx: Contesto, anno: number, d: DatiAnno) {
  const errori = erroriAnno(anno, d);
  if (errori.length) throw new ValidationError(errori.join('. '));
  const valori = {
    stato: d.stato as StatoCosti,
    voci: vociPulite(d.voci as Record<string, number>),
    oreServizio: (d.oreServizio as number | null | undefined) ?? null,
    note: typeof d.note === 'string' && d.note.trim() ? d.note.trim() : null,
  };
  const esistente = await CostiAziendali.findOne({ where: { idTenant: ctx.idTenant, anno } });
  if (esistente) {
    const prima = { stato: esistente.stato, voci: esistente.voci, oreServizio: esistente.oreServizio, note: esistente.note };
    await esistente.update(valori);
    traccia(ctx, 'vigilo.stima.anno', `Costi aziendali ${anno} aggiornati`, prima, valori);
  } else {
    const riga = await CostiAziendali.create({ idTenant: ctx.idTenant, anno, ...valori });
    traccia(ctx, 'vigilo.stima.anno', `Costi aziendali ${anno} inseriti`, null, riga);
  }
  return leggiParametri(ctx);
}

/** Toglie i costi aziendali di un anno */
export async function eliminaAnno(ctx: Contesto, anno: number) {
  const riga = await CostiAziendali.findOne({ where: { idTenant: ctx.idTenant, anno } });
  if (!riga) throw new NotFoundError(`Nessun costo aziendale per il ${anno}`);
  await riga.destroy();
  traccia(ctx, 'vigilo.stima.anno', `Costi aziendali ${anno} eliminati`, riga, null);
  return leggiParametri(ctx);
}
