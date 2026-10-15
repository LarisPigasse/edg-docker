'use strict';

/**
 * Migration: libreria versionata (blocco B4, ADR073)
 *
 * impronta  sha256 del contenuto senza la versione (src/libreria/impronta.ts):
 *           la sincronizzazione rifiuta un contenuto cambiato a parita' di
 *           versione invece di sovrascriverlo in silenzio
 * ordine    l'ordine dei file, per mostrare le voci nella procedura di avvio
 * codice    il codice della bozza (V01, F12...) per ritrovare la voce
 *
 * Il registro delle decisioni e la novita' sono nella migrazione 02 (ADR074).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE libreria_categorie
        ADD COLUMN impronta VARCHAR(64) NULL,
        ADD COLUMN ordine   INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE libreria_controlli
        ADD COLUMN codice   VARCHAR(8) NULL,
        ADD COLUMN impronta VARCHAR(64) NULL,
        ADD COLUMN ordine   INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE modelli_settore
        ADD COLUMN impronta VARCHAR(64) NULL;
      CREATE UNIQUE INDEX uq_libreria_controlli_codice ON libreria_controlli (codice) WHERE codice IS NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS uq_libreria_controlli_codice;
      ALTER TABLE modelli_settore DROP COLUMN IF EXISTS impronta;
      ALTER TABLE libreria_controlli DROP COLUMN IF EXISTS ordine, DROP COLUMN IF EXISTS impronta, DROP COLUMN IF EXISTS codice;
      ALTER TABLE libreria_categorie DROP COLUMN IF EXISTS ordine, DROP COLUMN IF EXISTS impronta;
    `);
  },
};
