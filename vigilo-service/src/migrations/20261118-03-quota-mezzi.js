'use strict';

/**
 * Migration: quota dei costi aziendali sui servizi con i mezzi (2026-11-18)
 *
 * costi_aziendali.quota_mezzi   la percentuale dei costi aziendali che spetta
 *                               ai trasporti e ai lavori con i mezzi; il resto
 *                               va alle altre attività (facchinaggio, deposito,
 *                               logistica…) e non entra nella stima. 100 = tutto
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE costi_aziendali
        ADD COLUMN quota_mezzi NUMERIC(5, 2) NOT NULL DEFAULT 100 CHECK (quota_mezzi >= 0 AND quota_mezzi <= 100);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE costi_aziendali DROP COLUMN IF EXISTS quota_mezzi;');
  },
};
