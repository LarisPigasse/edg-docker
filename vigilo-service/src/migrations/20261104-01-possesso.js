'use strict';

/**
 * Migration: costo di possesso dei mezzi (tappa 1 del costo dei mezzi)
 *
 * soggetti.possesso   JSON { modo, mensile, prezzo?, anni?, valoreFinale?,
 *                     canone?, dal? }: come si ha il mezzo (acquistato, in
 *                     leasing, a noleggio), i dati usati per la quota e la
 *                     quota mensile calcolata. Solo veicoli, macchine e
 *                     attrezzature; i limiti sono in impostazioni/limiti.ts e
 *                     le regole in domini/soggetti/possesso.ts.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE soggetti
        ADD COLUMN possesso JSONB NULL,
        ADD CONSTRAINT ck_soggetti_possesso CHECK (
          possesso IS NULL OR (jsonb_typeof(possesso) = 'object' AND tipo IN ('veicolo', 'macchina', 'attrezzatura'))
        );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE soggetti DROP CONSTRAINT IF EXISTS ck_soggetti_possesso, DROP COLUMN IF EXISTS possesso;
    `);
  },
};
