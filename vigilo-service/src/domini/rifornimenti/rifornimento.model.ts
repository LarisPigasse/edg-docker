// =============================================================================
// Rifornimento (costo dei mezzi, tappa 2): una spesa d'uso senza scadenza
// =============================================================================
// Carburante, AdBlue, pedaggi o altro di un veicolo, una macchina o
// un'attrezzatura. I km o le ore letti diventano una lettura del contatore
// (letture.id_rifornimento); la foto dello scontrino è un allegato con
// entita 'rifornimento'. Regole in rifornimenti.ts.
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, decimale, elenco, giorno, intero, istante, tenant, testo, uuid } from '../../core/db/colonne';
import type { Giorno } from '../../regole';
import { VOCI_RIFORNIMENTO, type VoceRifornimento } from '../valori';
import type { Fornitore } from '../fornitori/fornitore.model';
import type { Lettura } from '../contatori/lettura.model';
import type { Soggetto } from '../soggetti/soggetto.model';

export class Rifornimento extends ConAudit<Rifornimento> {
  declare idRifornimento: CreationOptional<number>;
  declare uuidRifornimento: CreationOptional<string>;
  declare idTenant: number;
  declare idSoggetto: number;
  declare fattoIl: Giorno;
  declare voce: VoceRifornimento;
  declare litri: CreationOptional<number | null>;
  declare importo: number;
  declare idFornitore: CreationOptional<number | null>;
  declare riferimento: CreationOptional<string | null>;
  declare note: CreationOptional<string | null>;

  declare soggetto?: NonAttribute<Soggetto>;
  declare fornitore?: NonAttribute<Fornitore | null>;
  declare lettura?: NonAttribute<Lettura | null>;
}

Rifornimento.init(
  {
    idRifornimento: chiave(),
    uuidRifornimento: uuid(),
    idTenant: tenant(),
    idSoggetto: intero(false),
    fattoIl: giorno(false),
    voce: elenco(VOCI_RIFORNIMENTO),
    litri: decimale('litri'),
    importo: { ...decimale('importo'), allowNull: false },
    idFornitore: intero(),
    riferimento: testo(128),
    note: testo(),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'rifornimenti' }
);
