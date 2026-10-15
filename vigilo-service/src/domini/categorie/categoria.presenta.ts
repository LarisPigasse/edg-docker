// =============================================================================
// Categorie — come escono dalle API (uuid, nessun id interno)
// =============================================================================
import type { Categoria } from './categoria.model';

export function presentaCategoria(c: Categoria) {
  const conteggi = c.get() as { nSoggetti?: string | number; nControlli?: string | number };
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
    ...(conteggi.nSoggetti !== undefined ? { soggetti: Number(conteggi.nSoggetti) } : {}),
    ...(conteggi.nControlli !== undefined ? { controlli: Number(conteggi.nControlli) } : {}),
    creataIl: c.createdAt,
    modificataIl: c.updatedAt,
  };
}

/** Riferimento breve dentro altre risorse */
export const riferimentoCategoria = (c: Categoria) => ({ uuid: c.uuidCategoria, nome: c.nome, icona: c.icona ?? null });
