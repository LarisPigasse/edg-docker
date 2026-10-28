// =============================================================================
// Contatori e letture (02-modello-dati, ADR071)
// =============================================================================
// Una lettura nuova: si segnala se anomala (all'indietro rispetto alle altre),
// si aggiornano valore e uso medio del contatore (solo letture non anomale) e
// si ricalcolano le scadenze a uso del mezzo. Le letture si possono
// eliminare (errori di battitura): il contatore si ricalcola dalle rimaste.
// L'addetto (own, B9b) inserisce letture dei mezzi del suo ambito e corregge
// (elimina) solo quelle che ha inserito lui a mano.
// =============================================================================
import type { Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ValidationError } from '../../core/utils/errors';
import type { Pagina } from '../../core/utils/lista';
import { confronta, letturaAnomala, usoGiornaliero, type Giorno } from '../../regole';
import { verificaAmbito } from '../ambito/ambito.service';
import { Contatore, Lettura, Soggetto } from '../modelli';
import { ricalcolaScadenze } from '../scadenze/ricalcolo.service';
import type { FonteLettura } from '../valori';

/** Valore, data e uso medio del contatore dalle sue letture non anomale */
export async function aggiornaContatore(c: Contatore, oggi: Giorno, transaction: Transaction): Promise<void> {
  const letture = await Lettura.findAll({ where: { idContatore: c.idContatore, anomala: false }, order: [['lettoIl', 'DESC'], ['idLettura', 'DESC']], transaction });
  const ultima = letture[0];
  const uso = usoGiornaliero(letture.map(l => ({ valore: l.valore, lettoIl: l.lettoIl })), oggi);
  await c.update(
    { valore: ultima?.valore ?? null, lettoIl: ultima?.lettoIl ?? null, usoGiornaliero: uso === null ? null : Math.round(uso * 100) / 100 },
    { transaction, hooks: false }
  );
}

/**
 * Registra una lettura (anche da una registrazione, B5.5) e aggiorna tutto
 * cio' che ne dipende. Restituisce la lettura creata.
 */
export async function registraLettura(
  ctx: Contesto,
  c: Contatore,
  dati: { valore: number; lettoIl: Giorno; note?: string | null; fonte?: FonteLettura; idRegistrazione?: number | null },
  transaction: Transaction
): Promise<Lettura> {
  if (confronta(dati.lettoIl, ctx.oggi) > 0) throw new ValidationError('La data della lettura non può essere nel futuro');
  const esistenti = await Lettura.findAll({ where: { idContatore: c.idContatore, anomala: false }, transaction });
  const anomala = letturaAnomala({ valore: dati.valore, lettoIl: dati.lettoIl }, esistenti.map(l => ({ valore: l.valore, lettoIl: l.lettoIl })));
  const l = await Lettura.create(
    {
      idTenant: ctx.idTenant,
      idContatore: c.idContatore,
      valore: dati.valore,
      lettoIl: dati.lettoIl,
      fonte: dati.fonte ?? 'manuale',
      idRegistrazione: dati.idRegistrazione ?? null,
      anomala,
      note: dati.note || null,
    },
    { transaction }
  );
  await aggiornaContatore(c, ctx.oggi, transaction);
  await ricalcolaScadenze({ idContatore: c.idContatore }, ctx.oggi, transaction);
  return l;
}

export async function aggiungiContatore(ctx: Contesto, uuidSoggetto: string, body: { unita: 'km' | 'ore'; nome?: string }) {
  const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuidSoggetto, ctx.idTenant, 'Soggetto');
  try {
    const c = await Contatore.create({ idTenant: ctx.idTenant, idSoggetto: s.idSoggetto, unita: body.unita, nome: body.nome?.trim() ?? '' });
    traccia(ctx, 'vigilo.contatore.creato', `Contatore ${body.unita} aggiunto a ${s.nome}`, null, c);
    return c.reload();
  } catch (e) {
    if ((e as { name?: string }).name === 'SequelizeUniqueConstraintError') throw new ConflictError('Il soggetto ha già un contatore con questa unità e questo nome');
    throw e;
  }
}

export async function nuovaLettura(ctx: Contesto, uuidContatore: string, body: { valore: number; lettoIl?: Giorno; note?: string | null }) {
  return sequelize.transaction(async transaction => {
    const c = await trovaNelTenant(Contatore, 'uuidContatore', uuidContatore, ctx.idTenant, 'Contatore', { transaction });
    await verificaAmbito(ctx, c.idSoggetto, 'Contatore');
    const l = await registraLettura(ctx, c, { valore: body.valore, lettoIl: body.lettoIl ?? ctx.oggi, note: body.note }, transaction);
    traccia(ctx, 'vigilo.lettura.registrata', `Lettura ${l.valore} ${c.unita}${l.anomala ? ' (anomala)' : ''}`, null, l);
    await c.reload({ transaction });
    return { lettura: await l.reload({ transaction }), contatore: c };
  });
}

export async function elencaLetture(ctx: Contesto, uuidContatore: string, p: Pagina) {
  const c = await trovaNelTenant(Contatore, 'uuidContatore', uuidContatore, ctx.idTenant, 'Contatore');
  await verificaAmbito(ctx, c.idSoggetto, 'Contatore');
  const { rows, count } = await Lettura.findAndCountAll({
    where: { idContatore: c.idContatore },
    order: [['lettoIl', p.verso], ['idLettura', p.verso]],
    limit: p.righe,
    offset: p.offset,
  });
  return { righe: rows, totale: count };
}

/** Una lettura sbagliata si elimina; quelle delle registrazioni no (si corregge la registrazione) */
export async function eliminaLettura(ctx: Contesto, uuidLettura: string): Promise<Contatore> {
  return sequelize.transaction(async transaction => {
    const l = await trovaNelTenant(Lettura, 'uuidLettura', uuidLettura, ctx.idTenant, 'Lettura', { transaction });
    if (l.idRegistrazione) throw new ConflictError('La lettura fa parte di una registrazione: si corregge la registrazione');
    const c = await Contatore.findByPk(l.idContatore, { transaction });
    if (!ctx.capacita.write) {
      // l'addetto: solo dentro il suo ambito e solo le letture che ha inserito lui
      await verificaAmbito(ctx, c?.idSoggetto, 'Lettura');
      if (l.creatoDa !== ctx.utente.id || l.fonte !== 'manuale') throw new ConflictError('Puoi correggere solo le letture che hai inserito tu');
    }
    const prima = snapshot(l);
    await l.destroy({ transaction });
    await aggiornaContatore(c!, ctx.oggi, transaction);
    await ricalcolaScadenze({ idContatore: c!.idContatore }, ctx.oggi, transaction);
    traccia(ctx, 'vigilo.lettura.eliminata', `Lettura ${prima?.valore} eliminata`, prima, null);
    return c!.reload({ transaction });
  });
}
