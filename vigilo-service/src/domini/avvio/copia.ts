// =============================================================================
// Copia con origine (ADR065): dalla libreria al cliente
// =============================================================================
// Ogni categoria e ogni controllo copiati conservano la fotografia dei valori
// della libreria (`origine`): servira' agli aggiornamenti (passo 3.6, B10) per
// distinguere i campi che il cliente ha personalizzato da quelli intatti.
// I campi della fotografia sono quelli che il cliente puo' cambiare.
// =============================================================================
import type { Transaction } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { Categoria, Controllo, ControlloCategoria, type LibreriaCategoria, type LibreriaControllo } from '../modelli';
import type { Origine } from '../valori';

export const CAMPI_CATEGORIA = ['nome', 'descrizione', 'icona', 'campi', 'contatori'] as const;

export const CAMPI_CONTROLLO = [
  'nome',
  'descrizione',
  'riferimentoNormativo',
  'natura',
  'automatico',
  'cadenza',
  'preavvisi',
  'tolleranza',
  'destinatari',
  'rinnovo',
  'rinviabile',
  'registrazione',
] as const;

type Valori = Record<string, unknown>;

const scegli = (voce: Valori, campi: readonly string[]): Valori => Object.fromEntries(campi.map(k => [k, voce[k] ?? null]));

/** Fotografia di una categoria della libreria */
export const origineCategoria = (lib: LibreriaCategoria): Origine => scegli(lib.get() as Valori, CAMPI_CATEGORIA);

const valoriControllo = (lib: LibreriaControllo): Valori => scegli(lib.get() as Valori, CAMPI_CONTROLLO);

/** Fotografia di un controllo della libreria, con le chiavi delle sue categorie */
export const origineControllo = (lib: LibreriaControllo): Origine => ({ ...valoriControllo(lib), categorie: [...lib.categorie] });

export async function copiaCategoria(ctx: Contesto, lib: LibreriaCategoria, transaction: Transaction): Promise<Categoria> {
  const origine = origineCategoria(lib);
  return Categoria.create(
    {
      ...(origine as object),
      idTenant: ctx.idTenant,
      tipoSoggetto: lib.tipoSoggetto,
      ordine: lib.ordine,
      chiaveLibreria: lib.chiave,
      versioneLibreria: lib.versione,
      origine,
    } as never,
    { transaction }
  );
}

/** Copia il controllo e lo collega alle categorie del cliente (gia' risolte) */
export async function copiaControllo(
  ctx: Contesto,
  lib: LibreriaControllo,
  categorie: Categoria[],
  transaction: Transaction
): Promise<Controllo> {
  const c = await Controllo.create(
    {
      ...(valoriControllo(lib) as object),
      idTenant: ctx.idTenant,
      tipoSoggetto: lib.tipoSoggetto,
      ordine: lib.ordine,
      chiaveLibreria: lib.chiave,
      versioneLibreria: lib.versione,
      origine: origineControllo(lib),
    } as never,
    { transaction }
  );
  if (categorie.length)
    await ControlloCategoria.bulkCreate(
      categorie.map(k => ({ idControllo: c.idControllo, idCategoria: k.idCategoria, idTenant: ctx.idTenant })),
      { transaction }
    );
  return c;
}
