'use strict';

/**
 * Migration: km annui nei costi aziendali (2026-11-18)
 *
 * costi_aziendali.km_annui   i km percorsi dall'azienda nell'anno (a mano o
 *                            suggeriti dai contatori dei veicoli): danno il
 *                            costo aziendale per km, che la stima mostra
 *                            accanto a quello per ora di servizio
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE costi_aziendali
        ADD COLUMN km_annui NUMERIC(14, 2) NULL CHECK (km_annui IS NULL OR km_annui > 0);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE costi_aziendali DROP COLUMN IF EXISTS km_annui;');
  },
};
