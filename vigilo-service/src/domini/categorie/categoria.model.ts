// =============================================================================
// Categoria del cliente (02-modello-dati, categorie)
// =============================================================================
// Raggruppa i soggetti di un tipo (es. "Autocarri > 3,5 t" fra i veicoli):
// porta i campi aggiuntivi e i contatori da creare sui soggetti nuovi, e
// decide quali controlli si applicano. Copiata dalla libreria o creata dal
// cliente.
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, booleano, chiave, ConAudit, elenco, intero, istante, json, tenant, testo, uuid } from '../../core/db/colonne';
import type { UnitaUso } from '../../regole';
import { TIPI_SOGGETTO, type CampoAggiuntivo, type Origine, type TipoSoggetto } from '../valori';
import type { Soggetto } from '../soggetti/soggetto.model';
import type { Controllo } from '../controlli/controllo.model';

export class Categoria extends ConAudit<Categoria> {
  declare idCategoria: CreationOptional<number>;
  declare uuidCategoria: CreationOptional<string>;
  declare idTenant: number;
  declare tipoSoggetto: TipoSoggetto;
  declare nome: string;
  declare descrizione: CreationOptional<string | null>;
  declare icona: CreationOptional<string | null>;
  declare ordine: CreationOptional<number>;
  declare attiva: CreationOptional<boolean>;
  declare campi: CreationOptional<CampoAggiuntivo[]>;
  declare contatori: CreationOptional<UnitaUso[]>;
  declare chiaveLibreria: CreationOptional<string | null>;
  declare versioneLibreria: CreationOptional<number | null>;
  declare origine: CreationOptional<Origine | null>;
  /** Aggiornamento della libreria che il cliente ha scelto di non applicare */
  declare versioneIgnorata: CreationOptional<number | null>;
  /** Prima apertura delle differenze della versione proposta (ADR074) */
  declare aggiornamentoVistoIl: CreationOptional<Date | null>;
  declare aggiornamentoVistoDa: CreationOptional<number | null>;

  declare soggetti?: NonAttribute<Soggetto[]>;
  declare controlli?: NonAttribute<Controllo[]>;
}

Categoria.init(
  {
    idCategoria: chiave(),
    uuidCategoria: uuid(),
    idTenant: tenant(),
    tipoSoggetto: elenco(TIPI_SOGGETTO),
    nome: testo(128, false),
    descrizione: testo(),
    icona: testo(32),
    ordine: intero(false, 0),
    attiva: booleano(true),
    campi: json(false, []),
    contatori: json(false, []),
    chiaveLibreria: testo(64),
    versioneLibreria: intero(),
    origine: json(true),
    versioneIgnorata: intero(),
    aggiornamentoVistoIl: istante(),
    aggiornamentoVistoDa: intero(),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'categorie' }
);
