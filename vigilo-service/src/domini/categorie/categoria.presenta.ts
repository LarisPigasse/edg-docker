// =============================================================================
// Categorie — come escono dalle API (uuid, nessun id interno)
// =============================================================================
import type { Categoria } from './categoria.model';
import { CAMPI_CATEGORIA } from '../avvio/copia';
import { uguale } from '../aggiornamenti/aggiornamenti';

/** Una categoria della libreria cambiata dal cliente rispetto alla fotografia (2026-11-19) */
export function personalizzata(c: Categoria): boolean {
  if (!c.chiaveLibreria || !c.origine) return false;
  const valori = c.get() as Record<string, unknown>;
  return CAMPI_CATEGORIA.some(k => k in c.origine! && !uguale(valori[k] ?? null, c.origine![k] ?? null));
}

export function presentaCategoria(c: Categoria) {
  const conteggi = c.get() as { nSoggetti?: string | number; nControlli?: string | number; eliminabile?: boolean };
  return {
    uuid: c.uuidCategoria,
    tipoSoggetto: c.tipoSoggetto,
    nome: c.nome,
    descrizione: c.descrizione ?? null,
    icona: c.icona ?? null,
    ordine: c.ordine,
    attiva: c.attiva,
    campi: c.campi,
    contatori: c.contatori,
    libreria: c.chiaveLibreria ? { chiave: c.chiaveLibreria, versione: c.versioneLibreria } : null,
    personalizzata: personalizzata(c),
    ...(conteggi.nSoggetti !== undefined ? { soggetti: Number(conteggi.nSoggetti) } : {}),
    ...(conteggi.nControlli !== undefined ? { controlli: Number(conteggi.nControlli) } : {}),
    /** Nessun soggetto (nemmeno archiviato) e nessun controllo che vale solo per lei: si può eliminare */
    ...(conteggi.eliminabile !== undefined ? { eliminabile: !!conteggi.eliminabile } : {}),
    creataIl: c.createdAt,
    modificataIl: c.updatedAt,
  };
}

/** Riferimento breve dentro altre risorse */
export const riferimentoCategoria = (c: Categoria) => ({ uuid: c.uuidCategoria, nome: c.nome, icona: c.icona ?? null });
