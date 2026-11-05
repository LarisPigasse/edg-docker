'use strict';

/**
 * Migration: rifornimenti (costo dei mezzi, tappa 2: blocco Uso)
 *
 * rifornimenti            una spesa d'uso di un mezzo senza scadenza: voce
 *                         (carburante, adblue, pedaggi, altro), litri solo per
 *                         carburante e AdBlue, importo, fornitore facoltativo.
 *                         Il tipo del soggetto (veicolo, macchina,
 *                         attrezzatura) e i limiti si controllano nel servizio
 *                         (domini/rifornimenti/rifornimenti.ts).
 * letture.id_rifornimento i km o le ore letti al rifornimento diventano una
 *                         lettura del contatore (fonte 'rifornimento'); con il
 *                         rifornimento se ne va anche la lettura.
 * allegati.entita         anche 'rifornimento' (la foto dello scontrino).
 */

const AUDIT = `
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  creato_da     INTEGER NULL,
  modificato_da INTEGER NULL`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE rifornimenti (
        id_rifornimento   SERIAL PRIMARY KEY,
        uuid_rifornimento UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant         INTEGER NOT NULL,
        id_soggetto       INTEGER NOT NULL REFERENCES soggetti (id_soggetto) ON DELETE CASCADE,
        fatto_il          DATE NOT NULL,
        voce              VARCHAR(16) NOT NULL CHECK (voce IN ('carburante','adblue','pedaggi','altro')),
        litri             NUMERIC(10,2) NULL CHECK (litri IS NULL OR (litri > 0 AND voce IN ('carburante','adblue'))),
        importo           NUMERIC(12,2) NOT NULL CHECK (importo > 0),
        id_fornitore      INTEGER NULL REFERENCES fornitori (id_fornitore) ON DELETE RESTRICT,
        riferimento       VARCHAR(128) NULL,
        note              TEXT NULL,
        ${AUDIT}
      );
      CREATE INDEX idx_rifornimenti_soggetto ON rifornimenti (id_tenant, id_soggetto, fatto_il DESC);
      CREATE INDEX idx_rifornimenti_periodo ON rifornimenti (id_tenant, fatto_il);
      CREATE INDEX idx_rifornimenti_fornitore ON rifornimenti (id_fornitore) WHERE id_fornitore IS NOT NULL;

      ALTER TABLE letture
        ADD COLUMN id_rifornimento INTEGER NULL REFERENCES rifornimenti (id_rifornimento) ON DELETE CASCADE,
        DROP CONSTRAINT letture_fonte_check,
        ADD CONSTRAINT letture_fonte_check CHECK (fonte IN ('manuale','registrazione','telematica','importazione','rifornimento'));

      ALTER TABLE allegati
        DROP CONSTRAINT allegati_entita_check,
        ADD CONSTRAINT allegati_entita_check CHECK (entita IN ('soggetto','scadenza','registrazione','rifornimento'));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM allegati WHERE entita = 'rifornimento';
      ALTER TABLE allegati
        DROP CONSTRAINT allegati_entita_check,
        ADD CONSTRAINT allegati_entita_check CHECK (entita IN ('soggetto','scadenza','registrazione'));
      DELETE FROM letture WHERE fonte = 'rifornimento';
      ALTER TABLE letture
        DROP CONSTRAINT letture_fonte_check,
        ADD CONSTRAINT letture_fonte_check CHECK (fonte IN ('manuale','registrazione','telematica','importazione')),
        DROP COLUMN IF EXISTS id_rifornimento;
      DROP TABLE IF EXISTS rifornimenti;
    `);
  },
};
