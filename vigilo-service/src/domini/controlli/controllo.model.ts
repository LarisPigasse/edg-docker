// =============================================================================
// Controllo del cliente (01-dominio, 02-modello-dati, ADR065)
// =============================================================================
// La definizione di cosa va fatto e ogni quanto (revisione, tagliando, visita
// medica, rata del leasing...). Porta i 4 gruppi ereditabili (cadenza,
// preavvisi, tolleranza, destinatari) che le scadenze possono ridefinire.
// Se viene dalla libreria ricorda chiave, versione e la fotografia dei valori
// copiati (origine), per proporre gli aggiornamenti senza perdere le
// personalizzazioni (passo 3.6).
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, booleano, chiave, ConAudit, elenco, intero, istante, json, tenant, testo, uuid } from '../../core/db/colonne';
import type { Cadenza, Destinatario, Preavvisi, Tolleranza } from '../../regole';
import {
  NATURE,
  RINNOVI,
  TIPI_SOGGETTO,
  type Natura,
  type Origine,
  type RegoleRegistrazione,
  type Rinnovo,
  type TipoSoggetto,
} from '../valori';
import type { Categoria } from '../categorie/categoria.model';
import type { Scadenza } from '../scadenze/scadenza.model';

export class Controllo extends ConAudit<Controllo> {
  declare idControllo: CreationOptional<number>;
  declare uuidControllo: CreationOptional<string>;
  declare idTenant: number;
  declare nome: string;
  declare descrizione: CreationOptional<string | null>;
  declare riferimentoNormativo: CreationOptional<string | null>;
  declare natura: Natura;
  declare tipoSoggetto: TipoSoggetto;
  /** Le scadenze si creano da sole sui soggetti delle sue categorie */
  declare automatico: CreationOptional<boolean>;
  declare cadenza: Cadenza;
  declare preavvisi: Preavvisi;
  declare tolleranza: Tolleranza;
  declare destinatari: Destinatario[];
  /** tacito: alla scadenza si rinnova da solo (es. abbonamenti) */
  declare rinnovo: CreationOptional<Rinnovo>;
  declare rinviabile: CreationOptional<boolean>;
  /** Avvisi pieni anche quando il soggetto e' fermo (es. assicurazione) */
  declare avvisaAncheSeFermo: CreationOptional<boolean>;
  declare registrazione: CreationOptional<RegoleRegistrazione>;
  declare ordine: CreationOptional<number>;
  declare attivo: CreationOptional<boolean>;
  declare chiaveLibreria: CreationOptional<string | null>;
  declare versioneLibreria: CreationOptional<number | null>;
  declare origine: CreationOptional<Origine | null>;
  /** Aggiornamento della libreria che il cliente ha scelto di non applicare */
  declare versioneIgnorata: CreationOptional<number | null>;
  /** Prima apertura delle differenze della versione proposta (ADR074) */
  declare aggiornamentoVistoIl: CreationOptional<Date | null>;
  declare aggiornamentoVistoDa: CreationOptional<number | null>;

  declare categorie?: NonAttribute<Categoria[]>;
  declare scadenze?: NonAttribute<Scadenza[]>;
}

Controllo.init(
  {
    idControllo: chiave(),
    uuidControllo: uuid(),
    idTenant: tenant(),
    nome: testo(128, false),
    descrizione: testo(),
    riferimentoNormativo: testo(256),
    natura: elenco(NATURE),
    tipoSoggetto: elenco(TIPI_SOGGETTO),
    automatico: booleano(false),
    cadenza: json(),
    preavvisi: json(),
    tolleranza: json(),
    destinatari: json(),
    rinnovo: elenco(RINNOVI, false, 'conferma'),
    rinviabile: booleano(true),
    avvisaAncheSeFermo: booleano(false),
    registrazione: json(false, {}),
    ordine: intero(false, 0),
    attivo: booleano(true),
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
  { sequelize, tableName: 'controlli' }
);
