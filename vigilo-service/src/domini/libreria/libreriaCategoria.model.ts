// =============================================================================
// Libreria EDG — categoria proposta (03-libreria-avvio)
// =============================================================================
// Tabella globale (senza tenant), sincronizzata all'avvio dai file versionati
// di src/libreria (blocco B4). Le categorie del cliente ne sono copie.
// =============================================================================
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../config/database';
import { booleano, elenco, intero, json, testo } from '../../core/db/colonne';
import type { UnitaUso } from '../../regole';
import { TIPI_SOGGETTO, type CampoAggiuntivo, type TipoSoggetto } from '../valori';

export class LibreriaCategoria extends Model<InferAttributes<LibreriaCategoria>, InferCreationAttributes<LibreriaCategoria>> {
  declare chiave: string;
  declare tipoSoggetto: TipoSoggetto;
  declare nome: string;
  declare descrizione: CreationOptional<string | null>;
  declare icona: CreationOptional<string | null>;
  declare campi: CreationOptional<CampoAggiuntivo[]>;
  declare contatori: CreationOptional<UnitaUso[]>;
  declare versione: number;
  declare ritirata: CreationOptional<boolean>;
  /** sha256 del contenuto senza versione (src/libreria/impronta.ts) */
  declare impronta: CreationOptional<string | null>;
  declare ordine: CreationOptional<number>;
  /** Che cosa cambia in questa versione e perche' (mostrato nella proposta) */
  declare novita: CreationOptional<string | null>;
  declare updatedAt: CreationOptional<Date>;
}

LibreriaCategoria.init(
  {
    chiave: { type: DataTypes.STRING(64), primaryKey: true },
    tipoSoggetto: elenco(TIPI_SOGGETTO),
    nome: testo(128, false),
    descrizione: testo(),
    icona: testo(32),
    campi: json(false, []),
    contatori: json(false, []),
    versione: { type: DataTypes.INTEGER, allowNull: false },
    ritirata: booleano(false),
    impronta: testo(64),
    ordine: intero(false, 0),
    novita: testo(),
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'libreria_categorie', createdAt: false }
);
