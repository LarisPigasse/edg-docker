'use strict';

/**
 * Migration: controlli non seguiti per soggetto (revisione 2026-11-11)
 *
 * controlli_non_seguiti   una decisione dell'ufficio: questo controllo non si
 *                         segue per questo soggetto (es. mezzo esente dal
 *                         bollo), con il motivo obbligatorio. Chi e quando ha
 *                         deciso sono creato_da e created_at; quando si torna
 *                         a seguirlo la riga resta come storico e si chiude
 *                         con ripresa_il, ripresa_da e una nota facoltativa.
 *                         Una sola decisione in corso per coppia (indice
 *                         parziale su ripresa_il IS NULL).
 * scadenze.motivo_chiusura anche 'non-seguita': la scadenza aperta si chiude
 *                         quando si smette di seguire il controllo e si
 *                         riapre, con le sue date, quando si riprende.
 */

const AUDIT = `
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  creato_da     INTEGER NULL,
  modificato_da INTEGER NULL`;

const MOTIVI = (...m) => m.map(x => `'${x}'`).join(',');
const PRIMA = MOTIVI('rinnovata', 'completata', 'fine-ricorrenza', 'soggetto-dismesso', 'controllo-disattivato');
const DOPO = MOTIVI('rinnovata', 'completata', 'fine-ricorrenza', 'soggetto-dismesso', 'controllo-disattivato', 'non-seguita');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE controlli_non_seguiti (
        id_esclusione   SERIAL PRIMARY KEY,
        uuid_esclusione UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant       INTEGER NOT NULL,
        id_soggetto     INTEGER NOT NULL REFERENCES soggetti (id_soggetto) ON DELETE CASCADE,
        id_controllo    INTEGER NOT NULL REFERENCES controlli (id_controllo) ON DELETE CASCADE,
        motivo          VARCHAR(512) NOT NULL CHECK (length(trim(motivo)) > 0),
        ripresa_il      TIMESTAMPTZ NULL,
        ripresa_da      INTEGER NULL,
        nota_ripresa    VARCHAR(512) NULL,
        ${AUDIT}
      );
      CREATE UNIQUE INDEX uq_controlli_non_seguiti_in_corso ON controlli_non_seguiti (id_soggetto, id_controllo) WHERE ripresa_il IS NULL;
      CREATE INDEX idx_controlli_non_seguiti_soggetto ON controlli_non_seguiti (id_tenant, id_soggetto, created_at DESC);

      ALTER TABLE scadenze
        DROP CONSTRAINT scadenze_motivo_chiusura_check,
        ADD CONSTRAINT scadenze_motivo_chiusura_check CHECK (motivo_chiusura IN (${DOPO}));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE scadenze SET motivo_chiusura = 'controllo-disattivato' WHERE motivo_chiusura = 'non-seguita';
      ALTER TABLE scadenze
        DROP CONSTRAINT scadenze_motivo_chiusura_check,
        ADD CONSTRAINT scadenze_motivo_chiusura_check CHECK (motivo_chiusura IN (${PRIMA}));
      DROP TABLE IF EXISTS controlli_non_seguiti;
    `);
  },
};
