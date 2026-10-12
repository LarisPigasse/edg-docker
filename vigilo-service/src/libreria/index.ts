// =============================================================================
// Libreria EDG — l'insieme delle voci (libreria-bozza.md, approvata 2026-10-12)
// =============================================================================
import * as attrezzature from './attrezzature';
import * as azienda from './azienda';
import * as macchine from './macchine';
import { MODELLI } from './modelli';
import * as persone from './persone';
import * as sedi from './sedi';
import type { Libreria } from './tipi';
import * as veicoli from './veicoli';

const PER_TIPO = [veicoli, macchine, attrezzature, sedi, persone, azienda];

export const LIBRERIA: Libreria = {
  modelli: MODELLI,
  categorie: PER_TIPO.flatMap(t => t.CATEGORIE),
  controlli: PER_TIPO.flatMap(t => t.CONTROLLI),
};

export * from './tipi';
export { validaLibreria } from './valida';
export { impronte, type Impronte } from './impronta';
