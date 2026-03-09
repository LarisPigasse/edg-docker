'use strict';

/**
 * Migration: 00-initial-schema
 *
 * Questa migration NON crea né modifica tabelle.
 * Le tabelle sono già state create tramite lo script SQL schema_edg_vehicles.sql.
 *
 * Scopo: registrare in SequelizeMeta il punto di partenza dello schema
 * in modo che le migration future possano procedere da qui.
 *
 * UP   → no-op (schema già esistente)
 * DOWN → no-op (non distruggiamo dati in rollback della migration base)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Schema già creato via script SQL — nessuna operazione necessaria.
    // Questa migration serve solo come baseline per SequelizeMeta.
    console.log('[Migration] 00-initial-schema: schema già presente, nessuna operazione.');
  },

  async down(queryInterface, Sequelize) {
    // Non eseguiamo rollback della migration base per sicurezza.
    console.log('[Migration] 00-initial-schema: rollback baseline ignorato per sicurezza.');
  },
};
