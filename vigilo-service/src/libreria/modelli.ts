// =============================================================================
// Libreria EDG — modelli di settore (03-libreria-avvio 3.3, libreria-bozza 9)
// =============================================================================
// Quali voci porta ogni modello lo dice la voce stessa (campo `modelli`):
// qui solo nome, descrizione e ordine. La versione cresce anche quando cambia
// l'elenco delle sue voci (impronta calcolata sulle appartenenze).
// =============================================================================
import type { VoceModello } from './tipi';

export const MODELLI: VoceModello[] = [
  {
    chiave: 'base',
    nome: 'Base aziendale',
    descrizione:
      "Azienda, sedi e persone: sicurezza sul lavoro, presidi antincendio, impianti, visite mediche, formazione, polizze, contratti e promemoria.",
    icona: 'Building2',
    ordine: 1,
    sempreProposto: true,
    versione: 1,
  },
  {
    chiave: 'trasporto',
    nome: 'Autotrasporto merci',
    descrizione:
      'Veicoli leggeri e pesanti, rimorchi, tachigrafo; autisti con patenti, CQC e carta tachigrafica; Albo, REN e rimborso accise.',
    icona: 'Truck',
    ordine: 2,
    sempreProposto: false,
    versione: 1,
  },
  {
    chiave: 'logistica',
    nome: 'Logistica e magazzino',
    descrizione: 'Carrelli elevatori, scaffalature, apparecchi di sollevamento, magazzini e abilitazioni dei carrellisti.',
    icona: 'Warehouse',
    ordine: 3,
    sempreProposto: false,
    versione: 1,
  },
  {
    chiave: 'agricoltura',
    nome: 'Agricoltura',
    descrizione: 'Trattori e macchine agricole a ore motore, irroratrici, abilitazioni e patentino per i prodotti fitosanitari.',
    icona: 'Tractor',
    ordine: 4,
    sempreProposto: false,
    versione: 1,
  },
  {
    chiave: 'edilizia',
    nome: 'Movimento terra ed edilizia',
    descrizione: 'Escavatori, gru, piattaforme e telescopici; verifiche periodiche, cantieri, ponteggi, DPI anticaduta e abilitazioni.',
    icona: 'HardHat',
    ordine: 5,
    sempreProposto: false,
    versione: 1,
  },
];
