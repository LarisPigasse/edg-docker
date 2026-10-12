// =============================================================================
// Libreria EDG — persone (libreria-bozza.md, sezione 7)
// =============================================================================
// I ruoli (preposto, carrellista...) non sono categorie: una persona ne ha piu'
// d'uno. Sono controlli non automatici validi per tutte le persone.
// =============================================================================
import type { Durata } from '../regole';
import { anni, categorieDi, controlliDi, da, giorni, m, mesi, ogni, PREAVVISI, tolleranzaGiorni } from './costruttori';
import type { Appartenenza, VoceCategoria, VoceControllo } from './tipi';

const categoria = categorieDi('persona');
const controllo = controlliDi('persona');

const UFFICIO = 'persona.ufficio';
const OPERATIVI = 'persona.operativi';
const AUTISTI = 'persona.autisti';
const TUTTE: string[] = [];

const NASCITA = 'nascita';
const ACCORDO = 'art. 37 D.Lgs 81/08; Accordo Stato-Regioni 17/4/2025 (59/CSR)';

export const CATEGORIE: VoceCategoria[] = [
  categoria({ chiave: UFFICIO, nome: "Personale d'ufficio", descrizione: 'Videoterminalisti', icona: 'Briefcase', modelli: m('B✓') }),
  categoria({
    chiave: OPERATIVI,
    nome: 'Personale operativo',
    descrizione: 'Magazzino, officina, cantiere, campagna',
    icona: 'Users',
    modelli: m('B✓'),
  }),
  categoria({ chiave: AUTISTI, nome: 'Autisti', descrizione: 'Patenti superiori, CQC, tachigrafo', icona: 'IdCard', modelli: m('T✓ L✓ A E') }),
];

// -----------------------------------------------------------------------------
// Documenti (7.2)
// -----------------------------------------------------------------------------
const DOCUMENTI: VoceControllo[] = [
  controllo({
    chiave: 'persona.patente-b',
    codice: 'D01',
    nome: 'Patente B',
    natura: 'documento',
    categorie: TUTTE,
    automatico: false,
    cadenza: ogni(anni(10), {
      da: 'scadenza',
      fasce: { da: NASCITA, elenco: [da(anni(50), anni(5)), da(anni(70), anni(3)), da(anni(80), anni(2))] },
    }),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'art. 126 c.2 CdS; DL 5/2012 art. 7',
    note: 'Scade al compleanno; rinnovando prima la nuova scadenza si conta dalla vecchia. Controllare la data sul documento. La direttiva (UE) 2025/2205 la porterà a 15 anni (recepimento entro il 26/11/2028).',
    modelli: m('B✓ T L A E'),
  }),
  controllo({
    chiave: 'persona.patente-c',
    codice: 'D02',
    nome: 'Patente C / CE',
    natura: 'documento',
    categorie: [AUTISTI],
    cadenza: ogni(anni(5), { fasce: { da: NASCITA, elenco: [da(anni(65), anni(2))] } }),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'art. 126 c.3 CdS',
    note: 'Dai 65 anni rinnovo in Commissione medica; oltre 20 t serve anche l\'attestato annuale fino ai 68 anni. Controllare la data sul documento.',
    modelli: m('T✓ L✓ A E'),
  }),
  controllo({
    chiave: 'persona.attestato-cml',
    codice: 'D03',
    nome: 'Attestato CML per complessi oltre 20 t',
    descrizione: 'Autisti dai 65 ai 68 anni',
    natura: 'documento',
    categorie: [AUTISTI],
    automatico: false,
    cadenza: ogni(anni(1)),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'art. 115 c.2 lett. a CdS',
    modelli: m('T'),
  }),
  controllo({
    chiave: 'persona.cqc',
    codice: 'D04',
    nome: 'CQC merci',
    natura: 'documento',
    categorie: [AUTISTI],
    cadenza: ogni(anni(5), { da: 'finestra', finestra: mesi(12) }),
    preavvisi: PREAVVISI.lungo(),
    riferimentoNormativo: 'D.Lgs 286/2005; DM 30/7/2021 artt. 15 e 19',
    note: 'Corso di 35 ore concluso nei 12 mesi prima: la validità riparte dalla scadenza. Scaduta, non si guida; oltre 3 anni serve l\'esame.',
    modelli: m('T✓ L✓ A E'),
  }),
  controllo({
    chiave: 'persona.carta-tachigrafica',
    codice: 'D05',
    nome: 'Carta tachigrafica del conducente',
    natura: 'documento',
    categorie: [AUTISTI],
    cadenza: ogni(anni(5), { da: 'scadenza' }),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'Reg. UE 165/2014 artt. 26 e 28',
    note: 'Il rinnovo va chiesto almeno 15 giorni lavorativi prima della scadenza.',
    modelli: m('T✓ L E'),
  }),
  controllo({
    chiave: 'persona.scarico-carta',
    codice: 'D06',
    nome: 'Scarico dati della carta del conducente',
    natura: 'adempimento',
    categorie: [AUTISTI],
    cadenza: ogni(giorni(28)),
    preavvisi: PREAVVISI.breve(),
    riferimentoNormativo: 'Reg. UE 581/2010 art. 1',
    modelli: m('T✓ L E'),
  }),
  controllo({
    chiave: 'persona.adr',
    codice: 'D07',
    nome: 'Certificato ADR del conducente',
    natura: 'documento',
    categorie: [AUTISTI],
    automatico: false,
    cadenza: ogni(anni(5), { da: 'finestra', finestra: mesi(12) }),
    preavvisi: PREAVVISI.lungo(),
    riferimentoNormativo: 'ADR 8.2.2.8',
    modelli: m('T'),
  }),
  controllo({
    chiave: 'persona.carta-identita',
    codice: 'D08',
    nome: "Carta d'identità",
    natura: 'documento',
    categorie: TUTTE,
    automatico: false,
    cadenza: ogni(anni(10)),
    preavvisi: PREAVVISI.normale(),
    riferimentoNormativo: 'DL 112/2008 art. 31; DL 5/2012 art. 7',
    note: "Scade al compleanno. Dal 30/07/2026 la carta elettronica degli over 70 non scade più; la carta cartacea non vale per l'espatrio dal 3/08/2026.",
    modelli: m('B T L A E'),
  }),
  controllo({
    chiave: 'persona.passaporto',
    codice: 'D09',
    nome: 'Passaporto',
    natura: 'documento',
    categorie: TUTTE,
    automatico: false,
    cadenza: ogni(anni(10)),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'L. 1185/1967',
    modelli: m('T'),
  }),
  controllo({
    chiave: 'persona.permesso-soggiorno',
    codice: 'D10',
    nome: 'Permesso di soggiorno',
    natura: 'documento',
    categorie: TUTTE,
    automatico: false,
    cadenza: ogni(anni(2)),
    preavvisi: PREAVVISI.lungo(),
    tolleranza: tolleranzaGiorni(60),
    riferimentoNormativo: 'D.Lgs 286/1998 art. 5 c.4 e c.9-bis',
    note: 'Durata dal documento (1-3 anni): al rinnovo correggere la data proposta con quella del nuovo permesso. Si può continuare a lavorare se la domanda è presentata entro 60 giorni dalla scadenza.',
    modelli: m('B T L A E'),
  }),
];

// -----------------------------------------------------------------------------
// Salute (7.3)
// -----------------------------------------------------------------------------
const SALUTE: VoceControllo[] = [
  controllo({
    chiave: 'persona.visita-medica',
    codice: 'H01',
    nome: 'Visita medica periodica',
    natura: 'adempimento',
    categorie: [OPERATIVI, AUTISTI],
    cadenza: ogni(anni(1)),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'art. 41 c.2 lett. b D.Lgs 81/08',
    note: 'Di norma una volta l\'anno: se il medico competente fissa un\'altra periodicità, cambiarla sulla scadenza della persona.',
    modelli: m('B✓ T✓ L✓ A✓ E✓'),
  }),
  controllo({
    chiave: 'persona.visita-videoterminale',
    codice: 'H02',
    nome: 'Visita medica dei videoterminalisti',
    natura: 'adempimento',
    categorie: [UFFICIO],
    cadenza: ogni(anni(5), { fasce: { da: NASCITA, elenco: [da(anni(50), anni(2))] } }),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'art. 176 c.3 D.Lgs 81/08',
    note: 'Solo per chi usa il videoterminale almeno 20 ore la settimana; per gli altri la scadenza si elimina.',
    modelli: m('B✓'),
  }),
  controllo({
    chiave: 'persona.accertamento-droghe',
    codice: 'H03',
    nome: 'Accertamento di assenza di tossicodipendenza',
    natura: 'adempimento',
    categorie: [AUTISTI],
    cadenza: ogni(anni(1)),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: 'Intesa Stato-Regioni 30/10/2007; Provv. 18/9/2008',
    note: 'Nuovo accordo su alcol e droghe atteso entro il 31/12/2026 (DL 159/2025).',
    modelli: m('T✓ L✓ A E'),
  }),
];

// -----------------------------------------------------------------------------
// Formazione e abilitazioni (7.4): dalla data di fine corso, nessuna tolleranza
// -----------------------------------------------------------------------------
const NOTA_RITARDO = "Aggiornamento in ritardo: non si svolge la funzione finché non si fa; oltre 10 anni senza aggiornamento il titolo decade.";

interface Formazione {
  chiave: string;
  codice: string;
  nome: string;
  ogni: Durata;
  aggiornamento?: string;
  riferimento?: string;
  note?: string;
  automatico?: boolean;
  categorie?: string[];
  /** Vale la regola dei 10 anni dell'Accordo (FAQ 8); false per le formazioni con norma propria */
  accordo?: boolean;
  modelli: Appartenenza;
}

const formazione = (f: Formazione): VoceControllo =>
  controllo({
    chiave: `persona.${f.chiave}`,
    codice: f.codice,
    nome: f.nome,
    descrizione: f.aggiornamento ? `Aggiornamento: ${f.aggiornamento}` : undefined,
    natura: 'abilitazione',
    categorie: f.categorie ?? TUTTE,
    automatico: f.automatico ?? false,
    cadenza: ogni(f.ogni),
    preavvisi: PREAVVISI.prenota(),
    riferimentoNormativo: f.riferimento ?? ACCORDO,
    note: [f.note, f.accordo === false ? null : NOTA_RITARDO].filter(Boolean).join(' '),
    modelli: f.modelli,
  });

const abilitazione = (chiave: string, codice: string, cosa: string, modelli: Appartenenza, nota?: string): VoceControllo =>
  formazione({
    chiave: `abilitazione-${chiave}`,
    codice,
    nome: `Abilitazione ${cosa}`,
    ogni: anni(5),
    aggiornamento: '4 ore pratiche, solo in presenza',
    riferimento: `art. 73 c.5 D.Lgs 81/08; Accordo Stato-Regioni 17/4/2025 (59/CSR)`,
    note: nota,
    modelli,
  });

const FORMAZIONE: VoceControllo[] = [
  formazione({
    chiave: 'formazione-lavoratori',
    codice: 'F01',
    nome: 'Formazione dei lavoratori',
    ogni: anni(5),
    aggiornamento: '6 ore',
    automatico: true,
    modelli: m('B✓ T✓ L✓ A✓ E✓'),
  }),
  formazione({ chiave: 'preposto', codice: 'F02', nome: 'Preposto', ogni: anni(2), aggiornamento: '6 ore', riferimento: 'art. 37 c.7-ter D.Lgs 81/08; Accordo 59/CSR', modelli: m('B✓ T L A E') }),
  formazione({ chiave: 'dirigente', codice: 'F03', nome: 'Dirigente', ogni: anni(5), aggiornamento: '6 ore', modelli: m('B') }),
  formazione({
    chiave: 'datore-di-lavoro',
    codice: 'F04',
    nome: 'Datore di lavoro',
    ogni: anni(5),
    aggiornamento: '6 ore',
    note: 'Corso iniziale di 16 ore entro il 19/05/2027.',
    modelli: m('B✓'),
  }),
  formazione({ chiave: 'datore-rspp', codice: 'F05', nome: 'Datore di lavoro con compiti di RSPP', ogni: anni(5), aggiornamento: '8 ore', riferimento: 'art. 34 D.Lgs 81/08; Accordo 59/CSR', modelli: m('B') }),
  formazione({ chiave: 'rspp', codice: 'F06', nome: 'RSPP / ASPP', ogni: anni(5), aggiornamento: '40 ore (RSPP), 20 ore (ASPP)', riferimento: 'artt. 32 e 34 D.Lgs 81/08; Accordo 59/CSR', modelli: m('B') }),
  formazione({
    chiave: 'rls',
    codice: 'F07',
    nome: 'RLS',
    ogni: anni(1),
    aggiornamento: '4 ore (15-50 lavoratori), 8 ore (oltre 50); sotto 15 secondo il CCNL',
    riferimento: 'art. 37 c.11 D.Lgs 81/08; DL 159/2025',
    modelli: m('B✓'),
  }),
  formazione({
    chiave: 'primo-soccorso',
    codice: 'F08',
    nome: 'Addetto al primo soccorso',
    ogni: anni(3),
    aggiornamento: '6 ore (gruppo A), 4 ore (gruppi B e C)',
    riferimento: 'DM 388/2003 art. 3 c.5',
    accordo: false,
    modelli: m('B✓ T L A E'),
  }),
  formazione({
    chiave: 'antincendio',
    codice: 'F09',
    nome: 'Addetto antincendio',
    ogni: anni(5),
    aggiornamento: '2 / 5 / 8 ore (livello 1 / 2 / 3)',
    riferimento: 'DM 2/9/2021 art. 5',
    accordo: false,
    modelli: m('B✓ T L A E'),
  }),
  abilitazione('carrelli', 'F10', 'carrelli elevatori', m('T L✓ A E')),
  abilitazione('ple', 'F11', 'PLE', m('L E✓')),
  abilitazione('gru-autocarro', 'F12', 'gru per autocarro', m('T E✓')),
  abilitazione('gru-mobili', 'F13', 'gru mobili', m('E')),
  abilitazione('gru-torre', 'F14', 'gru a torre', m('E✓')),
  abilitazione('movimento-terra', 'F15', 'macchine movimento terra', m('A E✓'), 'Anche i mini-escavatori.'),
  abilitazione('trattori', 'F16', 'trattori agricoli o forestali', m('A✓ E')),
  abilitazione('pompe-calcestruzzo', 'F17', 'pompe per calcestruzzo', m('E')),
  abilitazione('carroponte', 'F18', 'carroponte', m('L E')),
  abilitazione('caricatori', 'F19', 'caricatori per la movimentazione di materiali', m('L A E')),
  abilitazione('raccoglifrutta', 'F20', 'carro raccoglifrutta', m('A')),
  formazione({
    chiave: 'addestramento-anticaduta',
    codice: 'F21',
    nome: "Addestramento all'uso dei DPI anticaduta",
    ogni: anni(1),
    riferimento: 'art. 77 c.4-5 D.Lgs 81/08',
    accordo: false,
    note: 'Periodicità scelta dal datore di lavoro: 1 anno è un valore prudente.',
    modelli: m('L A E✓'),
  }),
  formazione({ chiave: 'ponteggi', codice: 'F22', nome: 'Montaggio e smontaggio ponteggi', ogni: anni(4), aggiornamento: '4 ore (3 pratiche)', riferimento: 'All. XXI D.Lgs 81/08', accordo: false, modelli: m('E✓') }),
  formazione({ chiave: 'lavori-su-funi', codice: 'F23', nome: 'Lavori su funi (accesso e posizionamento)', ogni: anni(5), aggiornamento: '8 ore (4 pratiche)', riferimento: 'All. XXI D.Lgs 81/08', accordo: false, modelli: m('E') }),
  formazione({ chiave: 'coordinatore-sicurezza', codice: 'F24', nome: 'Coordinatore per la sicurezza (CSP / CSE)', ogni: anni(5), aggiornamento: '40 ore', riferimento: 'art. 98 D.Lgs 81/08; Accordo 59/CSR', modelli: m('E') }),
  formazione({
    chiave: 'patentino-fitosanitari',
    codice: 'F25',
    nome: 'Patentino per i prodotti fitosanitari',
    ogni: anni(5),
    aggiornamento: '12 ore',
    riferimento: 'D.Lgs 150/2012 art. 9',
    accordo: false,
    note: 'Alcune regioni ammettono il rinnovo fino a 6 mesi dopo la scadenza: impostare la tolleranza se è il caso.',
    modelli: m('A✓'),
  }),
];

export const CONTROLLI: VoceControllo[] = [...DOCUMENTI, ...SALUTE, ...FORMAZIONE];
