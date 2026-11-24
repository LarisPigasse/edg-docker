// =============================================================================
// Una stima dei costi salvata (2026-11-18, fase 3)
// =============================================================================
// La descrizione, i dati inseriti, la fotografia dei valori usati e il
// risultato come al salvataggio (così si rilegge anche dopo che i parametri
// cambiano), il totale e, dopo il servizio, il costo reale con chi e quando.
// =============================================================================
import { CreationOptional } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, decimale, elenco, intero, istante, json, tenant, testo, uuid } from '../../core/db/colonne';
import type { TipoServizio } from './calcolo';

export class StimaCosti extends ConAudit<StimaCosti> {
  declare idStima: CreationOptional<number>;
  declare uuidStima: CreationOptional<string>;
  declare idTenant: number;
  declare descrizione: CreationOptional<string | null>;
  declare tipo: TipoServizio;
  declare dati: Record<string, unknown>;
  declare usati: Record<string, unknown>;
  declare risultato: Record<string, unknown>;
  declare totale: number;
  declare costoReale: CreationOptional<number | null>;
  /** Prezzo applicato al cliente, opzionale (2026-11-23) */
  declare prezzo: CreationOptional<number | null>;
  declare noteReale: CreationOptional<string | null>;
  declare realeIl: CreationOptional<Date | null>;
  declare realeDa: CreationOptional<number | null>;
}

StimaCosti.init(
  {
    idStima: chiave(),
    uuidStima: uuid(),
    idTenant: tenant(),
    descrizione: testo(128),
    tipo: elenco(['km', 'ore']),
    dati: json(false, {}),
    usati: json(false, {}),
    risultato: json(false, {}),
    totale: { ...decimale('totale'), allowNull: false },
    costoReale: decimale('costoReale'),
    prezzo: decimale('prezzo'),
    noteReale: testo(1024),
    realeIl: istante(true),
    realeDa: intero(),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'stime_costi' }
);
