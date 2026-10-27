'use strict';

/**
 * Migration: recapiti email senza account (blocco B8d-4, ADR098)
 *
 * recapiti_email  un indirizzo che riceve gli avvisi di un tenant senza avere
 *                 un account (indirizzi aggiuntivi, persone con la sola email):
 *                 il codice del collegamento "Non ricevere più questi avvisi"
 *                 e, se l'ha chiesto, da quando non li riceve più.
 *                 Una riga per tenant e indirizzo, creata al primo invio.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE recapiti_email (
        id_recapito SERIAL PRIMARY KEY,
        id_tenant   INTEGER NOT NULL,
        email       VARCHAR(256) NOT NULL CHECK (email <> '' AND email = lower(btrim(email))),
        codice      VARCHAR(64) NOT NULL UNIQUE,
        escluso_il  TIMESTAMPTZ NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_recapiti_email UNIQUE (id_tenant, email)
      );
      CREATE INDEX idx_recapiti_esclusi ON recapiti_email (id_tenant) WHERE escluso_il IS NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS recapiti_email;`);
  },
};
