'use strict';

/**
 * Migration: motivo di chiusura "fuori-ambito" (2026-11-19)
 *
 * Togliendo una categoria a un controllo, le scadenze aperte dei soggetti
 * rimasti fuori si chiudono con motivo 'fuori-ambito'; rimettendola, si
 * riaprono con le loro date (controlli/controllo.service.ts).
 * Indietro: le 'fuori-ambito' diventano 'controllo-disattivato'.
 */

const MOTIVI = (...m) => m.map(x => `'${x}'`).join(',');
const PRIMA = MOTIVI('rinnovata', 'completata', 'fine-ricorrenza', 'soggetto-dismesso', 'controllo-disattivato', 'non-seguita');
const DOPO = MOTIVI('rinnovata', 'completata', 'fine-ricorrenza', 'soggetto-dismesso', 'controllo-disattivato', 'non-seguita', 'fuori-ambito');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE scadenze
        DROP CONSTRAINT scadenze_motivo_chiusura_check,
        ADD CONSTRAINT scadenze_motivo_chiusura_check CHECK (motivo_chiusura IN (${DOPO}));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE scadenze SET motivo_chiusura = 'controllo-disattivato' WHERE motivo_chiusura = 'fuori-ambito';
      ALTER TABLE scadenze
        DROP CONSTRAINT scadenze_motivo_chiusura_check,
        ADD CONSTRAINT scadenze_motivo_chiusura_check CHECK (motivo_chiusura IN (${PRIMA}));
    `);
  },
};
