// =============================================================================
// Le esclusioni in corso (controlli non seguiti), lette dal database
// =============================================================================
// Usate da chi crea o riapre scadenze dei controlli (ciclo.service,
// creazione a mano) per saltare le coppie (soggetto, controllo) che
// l'ufficio ha deciso di non seguire. Solo il modello: niente dipendenze
// verso ciclo.service, che le importa.
// =============================================================================
import { Op, type Transaction } from 'sequelize';
import { ControlloNonSeguito } from './esclusione.model';
import { coppia } from './esclusioni';

/** Le coppie "idSoggetto:idControllo" non seguite fra quelle indicate */
export async function coppieNonSeguite(idSoggetti: number[], idControlli: number[], transaction?: Transaction): Promise<Set<string>> {
  if (!idSoggetti.length || !idControlli.length) return new Set();
  const righe = await ControlloNonSeguito.findAll({
    where: { idSoggetto: [...new Set(idSoggetti)], idControllo: [...new Set(idControlli)], ripresaIl: { [Op.is]: null } },
    attributes: ['idSoggetto', 'idControllo'],
    transaction,
  });
  return new Set(righe.map(r => coppia(r.idSoggetto, r.idControllo)));
}

/** I controlli non seguiti per un soggetto */
export async function controlliNonSeguitiDi(idSoggetto: number, transaction?: Transaction): Promise<number[]> {
  const righe = await ControlloNonSeguito.findAll({
    where: { idSoggetto, ripresaIl: { [Op.is]: null } },
    attributes: ['idControllo'],
    transaction,
  });
  return righe.map(r => r.idControllo);
}
