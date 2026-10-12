// =============================================================================
// Libreria EDG — attrezzature (libreria-bozza.md, sezione 5)
// =============================================================================
import { anni, categorieDi, controlliDi, m, mesi, ogni, PREAVVISI, unaTantum } from './costruttori';
import type { VoceCategoria, VoceControllo } from './tipi';

const categoria = categorieDi('attrezzatura');
const controllo = controlliDi('attrezzatura');

const POLVERE = 'attrezzatura.estintori-polvere';
const CO2 = 'attrezzatura.estintori-co2';
const IDRICI = 'attrezzatura.estintori-idrici';
const SCAFFALATURE = 'attrezzatura.scaffalature';
const ANTICADUTA = 'attrezzatura.dpi-anticaduta';
const ACCESSORI = 'attrezzatura.accessori-sollevamento';
const SPONDE = 'attrezzatura.sponde-caricatrici';

const UNI_9994 = 'UNI 9994-1:2024; DM 1/9/2021';
const FABBRICAZIONE = 'fabbricazione';

export const CATEGORIE: VoceCategoria[] = [
  categoria({ chiave: POLVERE, nome: 'Estintori a polvere', icona: 'FireExtinguisher', modelli: m('B✓') }),
  categoria({ chiave: CO2, nome: 'Estintori a CO2', icona: 'FireExtinguisher', modelli: m('B✓') }),
  categoria({ chiave: IDRICI, nome: 'Estintori idrici e a schiuma', icona: 'FireExtinguisher', modelli: m('B') }),
  categoria({ chiave: SCAFFALATURE, nome: 'Scaffalature metalliche', icona: 'Boxes', modelli: m('T L✓') }),
  categoria({
    chiave: ANTICADUTA,
    nome: 'DPI anticaduta',
    descrizione: 'Imbracature, cordini, dispositivi retrattili',
    icona: 'ShieldCheck',
    modelli: m('L A E✓'),
  }),
  categoria({
    chiave: ACCESSORI,
    nome: 'Accessori di sollevamento',
    descrizione: 'Brache, funi, catene',
    icona: 'Link',
    modelli: m('T L E'),
  }),
  categoria({ chiave: SPONDE, nome: 'Sponde idrauliche caricatrici', icona: 'ArrowUpFromLine', modelli: m('T✓ L') }),
];

export const CONTROLLI: VoceControllo[] = [
  controllo({
    chiave: 'attrezzatura.revisione-estintori',
    codice: 'A01',
    nome: 'Revisione',
    natura: 'adempimento',
    categorie: [POLVERE, CO2],
    cadenza: ogni(anni(5), { prima: { tempo: anni(5), da: FABBRICAZIONE } }),
    preavvisi: PREAVVISI.normale(),
    riferimentoNormativo: UNI_9994,
    note: 'Polvere: 60 mesi con la norma 2024 (prima 36). Per gli estintori immessi prima del 25/07/2024 i manutentori (UMAN) consigliano 36 mesi; il libretto del fabbricante, se più severo, prevale.',
    modelli: m('B✓'),
  }),
  controllo({
    chiave: 'attrezzatura.collaudo-estintori',
    codice: 'A02',
    nome: 'Collaudo',
    natura: 'adempimento',
    categorie: [POLVERE, CO2],
    cadenza: ogni(anni(10), { prima: { tempo: anni(10), da: FABBRICAZIONE } }),
    preavvisi: PREAVVISI.normale(),
    riferimentoNormativo: UNI_9994,
    modelli: m('B✓'),
  }),
  controllo({
    chiave: 'attrezzatura.revisione-estintori-idrici',
    codice: 'A03',
    nome: 'Revisione',
    natura: 'adempimento',
    categorie: [IDRICI],
    cadenza: ogni(anni(2), { prima: { tempo: anni(2), da: FABBRICAZIONE } }),
    preavvisi: PREAVVISI.normale(),
    riferimentoNormativo: UNI_9994,
    note: 'Serbatoio plastificato; 4 anni se inox o alluminio.',
    modelli: m('B'),
  }),
  controllo({
    chiave: 'attrezzatura.collaudo-estintori-idrici',
    codice: 'A04',
    nome: 'Collaudo',
    natura: 'adempimento',
    categorie: [IDRICI],
    cadenza: ogni(anni(6), { prima: { tempo: anni(6), da: FABBRICAZIONE } }),
    preavvisi: PREAVVISI.normale(),
    riferimentoNormativo: UNI_9994,
    note: 'Serbatoio plastificato; 10 anni se inox o alluminio.',
    modelli: m('B'),
  }),
  controllo({
    chiave: 'attrezzatura.fine-vita-estintori',
    codice: 'A05',
    nome: 'Fine vita',
    natura: 'promemoria',
    categorie: [POLVERE, CO2, IDRICI],
    cadenza: unaTantum({ tempo: anni(18), da: FABBRICAZIONE }),
    preavvisi: PREAVVISI.lungo(),
    riferimentoNormativo: 'UNI 9994-1:2024',
    modelli: m('B✓'),
  }),
  controllo({
    chiave: 'attrezzatura.ispezione-scaffalature',
    codice: 'A06',
    nome: 'Ispezione da persona competente',
    natura: 'adempimento',
    categorie: [SCAFFALATURE],
    cadenza: ogni(anni(1)),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'UNI EN 15635:2009; art. 71 c.4 e c.8 D.Lgs 81/08',
    note: "Dopo ogni urto serve un'ispezione immediata (promemoria).",
    modelli: m('T L✓'),
  }),
  controllo({
    chiave: 'attrezzatura.ispezione-anticaduta',
    codice: 'A07',
    nome: 'Ispezione periodica',
    natura: 'adempimento',
    categorie: [ANTICADUTA],
    cadenza: ogni(anni(1)),
    preavvisi: PREAVVISI.normale(),
    riferimentoNormativo: 'UNI EN 365; art. 77 c.4 D.Lgs 81/08',
    note: 'Il fabbricante può chiedere intervalli più brevi; dopo una caduta il dispositivo va controllato subito.',
    modelli: m('L A E✓'),
  }),
  controllo({
    chiave: 'attrezzatura.fine-vita-anticaduta',
    codice: 'A08',
    nome: 'Fine vita',
    natura: 'promemoria',
    categorie: [ANTICADUTA],
    automatico: false,
    cadenza: unaTantum({ tempo: anni(10), da: FABBRICAZIONE }),
    preavvisi: PREAVVISI.normale(),
    riferimentoNormativo: 'istruzioni del fabbricante',
    modelli: m('L A E'),
  }),
  controllo({
    chiave: 'attrezzatura.controllo-accessori',
    codice: 'A09',
    nome: 'Controllo trimestrale',
    natura: 'adempimento',
    categorie: [ACCESSORI],
    cadenza: ogni(mesi(3)),
    preavvisi: PREAVVISI.breve(),
    riferimentoNormativo: 'All. VI punto 3.1.2 D.Lgs 81/08',
    modelli: m('T L E'),
  }),
  controllo({
    chiave: 'attrezzatura.manutenzione-sponde',
    codice: 'A10',
    nome: 'Manutenzione e controllo',
    natura: 'manutenzione',
    categorie: [SPONDE],
    cadenza: ogni(anni(1)),
    preavvisi: PREAVVISI.normale(),
    riferimentoNormativo: 'EN 1756-1; art. 71 c.4 D.Lgs 81/08',
    modelli: m('T✓ L'),
  }),
];
