'use strict';

/**
 * Migration: ricavi, opzionali (2026-11-23, Analisi fase A)
 *
 * costi_aziendali.ricavi  i ricavi dell'anno, a consuntivo o a preventivo come
 *                         i costi; null = non indicati
 * stime_costi.prezzo      il prezzo applicato al cliente per il servizio
 *                         stimato; null = non indicato. Con questi l'Analisi
 *                         calcola margini e pareggio; senza, lo dice.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE costi_aziendali ADD COLUMN ricavi NUMERIC(14,2) NULL CHECK (ricavi IS NULL OR ricavi >= 0);
      ALTER TABLE stime_costi ADD COLUMN prezzo NUMERIC(14,2) NULL CHECK (prezzo IS NULL OR prezzo >= 0);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE stime_costi DROP COLUMN prezzo;
      ALTER TABLE costi_aziendali DROP COLUMN ricavi;
    `);
  },
};
