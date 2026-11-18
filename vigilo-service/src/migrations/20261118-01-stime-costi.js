'use strict';

/**
 * Migration: le stime dei costi salvate (2026-11-18, fase 3)
 *
 * stime_costi   una stima di un servizio: la descrizione, i dati inseriti
 *               (la richiesta di calcolo), la fotografia dei valori usati
 *               (costo del mezzo, costo orario, parametri, anno) e il
 *               risultato com'erano al salvataggio; il totale a parte per
 *               elenchi e ordinamenti; dopo il servizio il costo reale, con
 *               note, chi e quando, per lo scostamento
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE stime_costi (
        id_stima      SERIAL PRIMARY KEY,
        uuid_stima    UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant     INTEGER NOT NULL,
        descrizione   VARCHAR(128) NULL,
        tipo          VARCHAR(8) NOT NULL CHECK (tipo IN ('km', 'ore')),
        dati          JSONB NOT NULL,
        usati         JSONB NOT NULL,
        risultato     JSONB NOT NULL,
        totale        NUMERIC(12, 2) NOT NULL,
        costo_reale   NUMERIC(12, 2) NULL CHECK (costo_reale IS NULL OR costo_reale >= 0),
        note_reale    VARCHAR(1024) NULL,
        reale_il      TIMESTAMPTZ NULL,
        reale_da      INTEGER NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        creato_da     INTEGER NULL,
        modificato_da INTEGER NULL
      );
      CREATE INDEX stime_costi_tenant_data ON stime_costi (id_tenant, created_at DESC);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS stime_costi;');
  },
};
