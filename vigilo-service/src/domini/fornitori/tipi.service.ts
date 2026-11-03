// =============================================================================
// Tipi di fornitore — servizio (F0)
// =============================================================================
// Catalogo comune a tutti i tenant: lo leggono tutti (gli attivi), lo cambia
// solo root (soloRoot nelle rotte). "Altro" è il tipo di riserva: si rinomina
// ma non si disattiva né si elimina. Un tipo in uso non si elimina.
// =============================================================================
import { literal } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, NotFoundError, ValidationError } from '../../core/utils/errors';
import { Fornitore, TipoFornitore } from '../modelli';
import { LIMITI_TIPI_FORNITORE, chiaveDa, chiaveLibera, erroreNome } from './tipi';

/** Il tipo di riserva, che non si spegne */
export const TIPO_RISERVA = 'altro';

const QUANTI = {
  include: [[literal(`(SELECT count(*) FROM fornitori f WHERE f.id_tipo = "TipoFornitore".id_tipo)`), 'nFornitori']] as [ReturnType<typeof literal>, string][],
};

export function presentaTipo(t: TipoFornitore, conUso = false) {
  const n = (t.get() as { nFornitori?: string | number }).nFornitori;
  return {
    chiave: t.chiave,
    nome: t.nome,
    attivo: t.attivo,
    ordine: t.ordine,
    ...(conUso && n !== undefined ? { fornitori: Number(n) } : {}),
  };
}

/** Gli attivi per tutti; per root anche i disattivati, con quanti fornitori li usano in tutti i tenant */
export async function elencaTipi(root: boolean) {
  const tipi = await TipoFornitore.findAll({
    where: root ? {} : { attivo: true },
    ...(root ? { attributes: QUANTI } : {}),
    order: [
      ['ordine', 'ASC'],
      ['nome', 'ASC'],
    ],
  });
  return tipi.map(t => presentaTipo(t, root));
}

async function tipoDi(chiave: string): Promise<TipoFornitore> {
  const t = await TipoFornitore.findOne({ where: { chiave }, attributes: QUANTI });
  if (!t) throw new NotFoundError('Tipo di fornitore');
  return t;
}

/** Per i fornitori: il tipo da assegnare, che deve esistere ed essere attivo (tranne se è già il suo) */
export async function tipoAssegnabile(chiave: string, attuale?: number): Promise<TipoFornitore> {
  const t = await TipoFornitore.findOne({ where: { chiave } });
  if (!t) throw new ValidationError(`Tipo di fornitore sconosciuto: ${chiave}`);
  if (!t.attivo && t.idTipo !== attuale) throw new ValidationError(`Il tipo "${t.nome}" non è più in uso: scegline un altro`);
  return t;
}

export async function creaTipo(ctx: Contesto, nome: string) {
  const tutti = await TipoFornitore.findAll({ attributes: ['chiave', 'nome'] });
  if (tutti.length >= LIMITI_TIPI_FORNITORE.tipi) throw new ConflictError(`Al massimo ${LIMITI_TIPI_FORNITORE.tipi} tipi di fornitore`);
  const errore = erroreNome(nome, tutti.map(t => t.nome));
  if (errore) throw new ValidationError(errore);
  const chiave = chiaveLibera(chiaveDa(nome), new Set(tutti.map(t => t.chiave)));
  const t = await TipoFornitore.create({ chiave, nome: nome.trim() });
  traccia(ctx, 'vigilo.tipo-fornitore.creato', `Tipo di fornitore creato: ${t.nome}`, null, t);
  return presentaTipo(await tipoDi(chiave), true);
}

export async function modificaTipo(ctx: Contesto, chiave: string, dati: { nome?: string; attivo?: boolean; ordine?: number }) {
  const t = await tipoDi(chiave);
  const prima = snapshot(t);
  if (dati.nome !== undefined) {
    const altri = (await TipoFornitore.findAll({ attributes: ['nome', 'idTipo'] })).filter(x => x.idTipo !== t.idTipo).map(x => x.nome);
    const errore = erroreNome(dati.nome, altri);
    if (errore) throw new ValidationError(errore);
  }
  if (dati.attivo === false && t.chiave === TIPO_RISERVA) throw new ConflictError('"Altro" è il tipo di riserva: resta sempre attivo');
  await t.update({ ...(dati.nome !== undefined ? { nome: dati.nome.trim() } : {}), ...(dati.attivo !== undefined ? { attivo: dati.attivo } : {}), ...(dati.ordine !== undefined ? { ordine: dati.ordine } : {}) });
  traccia(ctx, 'vigilo.tipo-fornitore.modificato', `Tipo di fornitore modificato: ${t.nome}`, prima, t);
  return presentaTipo(await tipoDi(chiave), true);
}

export async function eliminaTipo(ctx: Contesto, chiave: string): Promise<void> {
  const t = await tipoDi(chiave);
  if (t.chiave === TIPO_RISERVA) throw new ConflictError('"Altro" è il tipo di riserva: non si elimina');
  const usati = await Fornitore.count({ where: { idTipo: t.idTipo } });
  if (usati) throw new ConflictError(`Il tipo è usato da ${usati === 1 ? '1 fornitore' : `${usati} fornitori`}: si può solo disattivare`);
  const prima = snapshot(t);
  await t.destroy();
  traccia(ctx, 'vigilo.tipo-fornitore.eliminato', `Tipo di fornitore eliminato: ${t.nome}`, prima, null);
}
