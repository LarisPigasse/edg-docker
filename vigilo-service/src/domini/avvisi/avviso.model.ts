// =============================================================================
// Avviso: un evento di una scadenza da far sapere (04-avvisi, ADR067)
// =============================================================================
// Nasce dai calcoli di regole/avvisi.ts, oppure (tipo 'libreria', senza
// scadenza) quando la libreria porta aggiornamenti al cliente (ADR074). Il vincolo unico (scadenza, evento,
// riferimento del ciclo) garantisce che lo stesso avviso non si ripeta; a chi
// va e come lo dicono le consegne.
// =============================================================================
import { CreationOptional, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { booleano, chiave, intero, istante, tenant, testo, uuid } from '../../core/db/colonne';
import type { Scadenza } from '../scadenze/scadenza.model';
import type { Consegna } from './consegna.model';

export class Avviso extends Model<InferAttributes<Avviso>, InferCreationAttributes<Avviso>> {
  declare idAvviso: CreationOptional<number>;
  declare uuidAvviso: CreationOptional<string>;
  declare idTenant: number;
  /** null solo per gli avvisi della libreria */
  declare idScadenza: CreationOptional<number | null>;
  /** Es. 'preavviso:32', 'scaduta', 'richiamo:2' (regole/avvisi.ts) */
  declare evento: string;
  declare tipo: string;
  declare urgente: CreationOptional<boolean>;
  /** Ciclo della scadenza (data|soglia): con evento rende l'avviso unico */
  declare riferimento: string;
  declare testo: string;
  declare createdAt: CreationOptional<Date>;

  declare scadenza?: NonAttribute<Scadenza | null>;
  declare consegne?: NonAttribute<Consegna[]>;
}

Avviso.init(
  {
    idAvviso: chiave(),
    uuidAvviso: uuid(),
    idTenant: tenant(),
    idScadenza: intero(),
    evento: testo(64, false),
    tipo: testo(32, false),
    urgente: booleano(false),
    riferimento: testo(64, false),
    testo: testo(512, false),
    createdAt: istante(false),
  },
  {
    sequelize,
    tableName: 'avvisi',
    updatedAt: false,
    validate: {
      scadenzaOLibreria(this: Avviso) {
        if (this.idScadenza == null && this.tipo !== 'libreria') throw new Error("Un avviso senza scadenza puo' essere solo della libreria");
      },
    },
  }
);
