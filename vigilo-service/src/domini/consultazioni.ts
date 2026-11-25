// =============================================================================
// Nomi degli oggetti consultati (passo 1e, ADR117)
// =============================================================================
// Per le consultazioni il cui gestore non ha già il nome in mano: si cercano
// solo quando la consultazione si registra davvero (core/services/consultazioni,
// campo `nome` come funzione), sempre dentro il tenant.
// =============================================================================
import { Categoria, Controllo, Soggetto } from './modelli';
import type { Allegato } from './allegati/allegato.model';
import { soggettoDellAllegato } from './allegati/allegati.service';

/** Nome di un soggetto dal suo uuid */
export async function nomeSoggetto(idTenant: number, uuid: string): Promise<string | null> {
  return (await Soggetto.findOne({ where: { uuidSoggetto: uuid, idTenant }, attributes: ['nome'] }))?.nome ?? null;
}

/** Nome di una voce di libreria del cliente (controllo o categoria) */
export async function nomeVoce(idTenant: number, entita: 'controllo' | 'categoria', uuid: string): Promise<string | null> {
  const v =
    entita === 'categoria'
      ? await Categoria.findOne({ where: { uuidCategoria: uuid, idTenant }, attributes: ['nome'] })
      : await Controllo.findOne({ where: { uuidControllo: uuid, idTenant }, attributes: ['nome'] });
  return v?.nome ?? null;
}

/** «nome del file» e, se c'è, il soggetto a cui appartiene: «Libretto.pdf» (DAF XF 01) */
export async function nomeAllegato(a: Allegato): Promise<string> {
  const idSoggetto = await soggettoDellAllegato(a);
  const s = idSoggetto ? await Soggetto.findByPk(idSoggetto, { attributes: ['nome'] }) : null;
  return `«${a.nomeFile}»${s?.nome ? ` (${s.nome})` : ''}`;
}
