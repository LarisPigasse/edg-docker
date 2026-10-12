// =============================================================================
// Libreria EDG — controllo proposto (03-libreria-avvio)
// =============================================================================
// Tabella globale (senza tenant). Alla procedura di avvio i valori si copiano
// nei controlli del cliente con origine (chiaveLibreria, versioneLibreria).
// =============================================================================
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../config/database';
import { booleano, elenco, intero, json, testo } from '../../core/db/colonne';
import type { Cadenza, Destinatario, Preavvisi, Tolleranza } from '../../regole';
import {
  NATURE,
  RINNOVI,
  TIPI_SOGGETTO,
  type Natura,
  type RegoleRegistrazione,
  type Rinnovo,
  type TipoSoggetto,
} from '../valori';

export class LibreriaControllo extends Model<InferAttributes<LibreriaControllo>, InferCreationAttributes<LibreriaControllo>> {
  declare chiave: string;
  /** Codice della bozza (V01, F12...) */
  declare codice: CreationOptional<string | null>;
  declare nome: string;
  declare descrizione: CreationOptional<string | null>;
  declare natura: Natura;
  declare tipoSoggetto: TipoSoggetto;
  /** Chiavi delle categorie di libreria a cui si applica */
  declare categorie: CreationOptional<string[]>;
  declare automatico: CreationOptional<boolean>;
  declare cadenza: Cadenza;
  declare preavvisi: Preavvisi;
  declare tolleranza: Tolleranza;
  declare destinatari: Destinatario[];
  declare rinnovo: CreationOptional<Rinnovo>;
  declare rinviabile: CreationOptional<boolean>;
  declare registrazione: CreationOptional<RegoleRegistrazione>;
  declare riferimentoNormativo: CreationOptional<string | null>;
  declare note: CreationOptional<string | null>;
  declare versione: number;
  declare ritirato: CreationOptional<boolean>;
  declare impronta: CreationOptional<string | null>;
  declare ordine: CreationOptional<number>;
  /** Che cosa cambia in questa versione e perche' (mostrato nella proposta) */
  declare novita: CreationOptional<string | null>;
  declare updatedAt: CreationOptional<Date>;
}

LibreriaControllo.init(
  {
    chiave: { type: DataTypes.STRING(64), primaryKey: true },
    codice: testo(8),
    nome: testo(128, false),
    descrizione: testo(),
    natura: elenco(NATURE),
    tipoSoggetto: elenco(TIPI_SOGGETTO),
    categorie: json(false, []),
    automatico: booleano(false),
    cadenza: json(),
    preavvisi: json(),
    tolleranza: json(),
    destinatari: json(),
    rinnovo: elenco(RINNOVI, false, 'conferma'),
    rinviabile: booleano(true),
    registrazione: json(false, {}),
    riferimentoNormativo: testo(256),
    note: testo(),
    versione: { type: DataTypes.INTEGER, allowNull: false },
    ritirato: booleano(false),
    impronta: testo(64),
    ordine: intero(false, 0),
    novita: testo(),
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'libreria_controlli', createdAt: false }
);
