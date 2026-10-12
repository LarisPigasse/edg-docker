// =============================================================================
// Contatore di un soggetto: km o ore (02-modello-dati, ADR071)
// =============================================================================
// Tiene l'ultima lettura e l'uso medio giornaliero (finestra di 128 giorni,
// regole/contatori.ts) per stimare quando si raggiunge una soglia a uso.
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, decimale, elenco, giorno, intero, istante, tenant, testo, uuid } from '../../core/db/colonne';
import { UNITA_USO, type Giorno, type UnitaUso } from '../../regole';
import type { Soggetto } from '../soggetti/soggetto.model';
import type { Lettura } from './lettura.model';

export class Contatore extends ConAudit<Contatore> {
  declare idContatore: CreationOptional<number>;
  declare uuidContatore: CreationOptional<string>;
  declare idTenant: number;
  declare idSoggetto: number;
  declare unita: UnitaUso;
  /** Distingue piu' contatori della stessa unita' (es. "gru"); '' = principale */
  declare nome: CreationOptional<string>;
  declare valore: CreationOptional<number | null>;
  declare lettoIl: CreationOptional<Giorno | null>;
  declare usoGiornaliero: CreationOptional<number | null>;

  declare soggetto?: NonAttribute<Soggetto>;
  declare letture?: NonAttribute<Lettura[]>;
}

Contatore.init(
  {
    idContatore: chiave(),
    uuidContatore: uuid(),
    idTenant: tenant(),
    idSoggetto: intero(false),
    unita: elenco(UNITA_USO),
    nome: { ...testo(64, false), defaultValue: '' },
    valore: intero(),
    lettoIl: giorno(),
    usoGiornaliero: decimale('usoGiornaliero'),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'contatori' }
);
