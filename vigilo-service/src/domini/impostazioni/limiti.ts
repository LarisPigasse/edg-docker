// =============================================================================
// Regole degli avvisi e degli interventi di un tenant: predefiniti e limiti
// (ADR093, passo 8) — puro
// =============================================================================
// Il cliente le cambia dalla Configurazione (B8d); qui i limiti che nessuno
// può superare, usati sia per rifiutare un valore sbagliato (erroriAvvisi)
// sia per leggere con sicurezza ciò che è salvato (avvisiEffettivi: i valori
// mancanti prendono il predefinito, quelli fuori limite si riportano dentro).
// =============================================================================

export interface Silenzio {
  /** 'HH:MM', ora italiana: da quando non parte nessuna email */
  dalle: string;
  /** 'HH:MM': fino a quando; uguale a `dalle` = nessun silenzio */
  alle: string;
}

export interface RegoleAvvisi {
  /** 'HH:MM', ora italiana */
  orarioRiepilogo: string;
  /** 1 = lunedì ... 7 = domenica */
  giorniLavorativi: number[];
  /** Giorni fra un richiamo e il successivo per una scadenza scaduta, 0 = nessuno (ADR067) */
  intervalloRichiami: number;
  silenzio: Silenzio;
}

export const AVVISI_INIZIALI: RegoleAvvisi = {
  orarioRiepilogo: '08:00',
  giorniLavorativi: [1, 2, 3, 4, 5],
  intervalloRichiami: 8,
  silenzio: { dalle: '22:00', alle: '07:00' },
};

export const LIMITI_AVVISI = {
  /** Il riepilogo parte fra queste ore */
  orarioRiepilogo: { min: '05:00', max: '12:00' },
  /** 0 = nessun richiamo, altrimenti da 1 a 64 giorni */
  intervalloRichiami: { min: 0, max: 64 },
  /** Il silenzio notturno dura al massimo 12 ore (720 minuti) */
  silenzioMassimoMinuti: 720,
} as const;

const ORARIO = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minuti dalla mezzanotte di un 'HH:MM', null se non valido */
export const minutiDi = (orario: unknown): number | null => {
  const m = typeof orario === 'string' ? ORARIO.exec(orario) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** Durata della finestra dalle → alle, anche a cavallo della mezzanotte */
export const durataSilenzio = (s: Silenzio): number => {
  const da = minutiDi(s.dalle) ?? 0;
  const a = minutiDi(s.alle) ?? 0;
  return (a - da + 1440) % 1440;
};

/** Gli errori di un insieme di regole (vuoto = valide), con parole per l'utente */
export function erroriAvvisi(r: Partial<RegoleAvvisi>): string[] {
  const errori: string[] = [];
  if (r.orarioRiepilogo !== undefined) {
    const m = minutiDi(r.orarioRiepilogo);
    if (m === null) errori.push("L'orario del riepilogo va scritto come 08:00");
    else if (m < minutiDi(LIMITI_AVVISI.orarioRiepilogo.min)! || m > minutiDi(LIMITI_AVVISI.orarioRiepilogo.max)!)
      errori.push(`Il riepilogo può partire fra le ${LIMITI_AVVISI.orarioRiepilogo.min} e le ${LIMITI_AVVISI.orarioRiepilogo.max}`);
  }
  if (r.giorniLavorativi !== undefined) {
    const g = r.giorniLavorativi;
    if (!Array.isArray(g) || !g.length || g.some(x => !Number.isInteger(x) || x < 1 || x > 7)) errori.push('Serve almeno un giorno lavorativo');
  }
  if (r.intervalloRichiami !== undefined) {
    const n = r.intervalloRichiami;
    const { min, max } = LIMITI_AVVISI.intervalloRichiami;
    if (!Number.isInteger(n) || n < min || n > max) errori.push(`Il richiamo delle scadute va da ${min} (nessuno) a ${max} giorni`);
  }
  if (r.silenzio !== undefined) {
    if (minutiDi(r.silenzio?.dalle) === null || minutiDi(r.silenzio?.alle) === null) errori.push('Gli orari del silenzio vanno scritti come 22:00');
    else if (durataSilenzio(r.silenzio) > LIMITI_AVVISI.silenzioMassimoMinuti) errori.push('Il silenzio notturno dura al massimo 12 ore');
  }
  return errori;
}

/** Le regole da usare: salvate se valide, altrimenti il predefinito di ciascuna */
export function avvisiEffettivi(salvate: Partial<RegoleAvvisi> | null | undefined): RegoleAvvisi {
  const s = salvate ?? {};
  const valida = <K extends keyof RegoleAvvisi>(k: K): RegoleAvvisi[K] =>
    s[k] !== undefined && erroriAvvisi({ [k]: s[k] } as Partial<RegoleAvvisi>).length === 0 ? (s[k] as RegoleAvvisi[K]) : AVVISI_INIZIALI[k];
  return {
    orarioRiepilogo: valida('orarioRiepilogo'),
    giorniLavorativi: [...new Set(valida('giorniLavorativi'))].sort((a, b) => a - b),
    intervalloRichiami: valida('intervalloRichiami'),
    silenzio: valida('silenzio'),
  };
}

/**
 * Le regole dopo una modifica parziale già validata con erroriAvvisi: si parte
 * da quelle in vigore e si rilegge tutto con avvisiEffettivi (giorni ordinati
 * e senza doppioni, nulla fuori limite).
 */
export const uniscilRegole = (salvate: Partial<RegoleAvvisi> | null | undefined, modifica: Partial<RegoleAvvisi>): RegoleAvvisi =>
  avvisiEffettivi({ ...avvisiEffettivi(salvate), ...modifica });

/** Due insiemi di regole uguali? (giorni già ordinati da avvisiEffettivi) */
export const stesseRegole = (a: RegoleAvvisi, b: RegoleAvvisi): boolean =>
  a.orarioRiepilogo === b.orarioRiepilogo &&
  a.intervalloRichiami === b.intervalloRichiami &&
  a.giorniLavorativi.join() === b.giorniLavorativi.join() &&
  a.silenzio.dalle === b.silenzio.dalle &&
  a.silenzio.alle === b.silenzio.alle;

/** Il momento (minuti dalla mezzanotte) è nel silenzio? */
export const inSilenzio = (minuti: number, s: Silenzio): boolean => {
  const durata = durataSilenzio(s);
  if (!durata) return false;
  return (minuti - minutiDi(s.dalle)! + 1440) % 1440 < durata;
};

// -----------------------------------------------------------------------------
// Costo di possesso dei mezzi (costo dei mezzi, tappa 1): limiti dei valori
// che si scrivono nella scheda. Larghi apposta: escludono l'assurdo (uno zero
// di troppo su un prezzo fuori scala, 0 anni), non le macchine vere; l'errore
// plausibile lo segnala l'avviso morbido del confronto con la categoria.
// -----------------------------------------------------------------------------

export const LIMITI_POSSESSO = {
  /** Prezzo d'acquisto, € (2^24) */
  prezzo: { min: 0, max: 16777216 },
  /** Anni di uso previsti */
  anni: { min: 1, max: 32 },
  /** Canone mensile di leasing o noleggio, € (2^16) */
  canone: { min: 0, max: 65536 },
} as const;

// Rifornimenti (costo dei mezzi, tappa 2): limiti di ciò che si scrive. Larghi
// anche per le macchine (serbatoi di trattori e gruppi elettrogeni).
export const LIMITI_RIFORNIMENTI = {
  /** Importo di un rifornimento, € (2^16) */
  importo: { min: 0, max: 65536 },
  /** Litri di un rifornimento (2^14) */
  litri: { min: 0, max: 16384 },
  /** Km o ore letti, come le letture dei contatori (2^24) */
  lettura: { min: 0, max: 16777216 },
} as const;

// -----------------------------------------------------------------------------
// Interventi (passo 8): costo orario predefinito e giorni proposti per riparare
// -----------------------------------------------------------------------------

export interface RegoleInterventi {
  /** €/h per le persone senza costo e per le righe di manodopera senza persona; null = non impostato */
  costoOrario: number | null;
  /** Un guasto che non blocca l'uso si propone da riparare entro tanti giorni */
  giorniRiparazione: number;
}

export const INTERVENTI_INIZIALI: RegoleInterventi = { costoOrario: null, giorniRiparazione: 8 };

export const LIMITI_INTERVENTI = {
  /** €/h, per il predefinito e per le persone */
  costoOrario: { min: 0, max: 1024 },
  giorniRiparazione: { min: 0, max: 64 },
} as const;

/** Un costo orario valido? (numero fra i limiti, al centesimo) */
export const costoOrarioValido = (n: unknown): n is number =>
  typeof n === 'number' &&
  Number.isFinite(n) &&
  n >= LIMITI_INTERVENTI.costoOrario.min &&
  n <= LIMITI_INTERVENTI.costoOrario.max &&
  Math.abs(Math.round(n * 100) - n * 100) < 1e-6;

/** Gli errori delle regole degli interventi (vuoto = valide), con parole per l'utente */
export function erroriInterventi(r: Partial<RegoleInterventi>): string[] {
  const errori: string[] = [];
  const { costoOrario: c, giorniRiparazione: g } = LIMITI_INTERVENTI;
  if (r.costoOrario !== undefined && r.costoOrario !== null && !costoOrarioValido(r.costoOrario))
    errori.push(`Il costo orario va da ${c.min} a ${c.max} €, al centesimo`);
  if (r.giorniRiparazione !== undefined && (!Number.isInteger(r.giorniRiparazione) || r.giorniRiparazione < g.min || r.giorniRiparazione > g.max))
    errori.push(`I giorni per riparare un guasto vanno da ${g.min} a ${g.max}`);
  return errori;
}

/** Le regole da usare: salvate se valide, altrimenti il predefinito di ciascuna */
export function interventiEffettivi(salvate: Partial<RegoleInterventi> | null | undefined): RegoleInterventi {
  const s = salvate ?? {};
  const valida = <K extends keyof RegoleInterventi>(k: K): RegoleInterventi[K] =>
    s[k] !== undefined && erroriInterventi({ [k]: s[k] } as Partial<RegoleInterventi>).length === 0 ? (s[k] as RegoleInterventi[K]) : INTERVENTI_INIZIALI[k];
  return { costoOrario: valida('costoOrario'), giorniRiparazione: valida('giorniRiparazione') };
}

// -----------------------------------------------------------------------------
// Stima dei costi di un servizio (2026-11-17): parametri generali del tenant e
// limiti dei costi aziendali per anno. Tutti modificabili dall'ufficio con i
// costi; i limiti escludono l'assurdo. Velocità e ore di guida hanno un valore
// iniziale; costo orario, diaria e pedaggio restano vuoti finché non si scrivono.
// -----------------------------------------------------------------------------

export interface RegoleStima {
  /** €/h del conducente o dell'operatore quando non si sceglie una persona; null = non impostato */
  costoOrarioConducente: number | null;
  /** km/h medi di guida, per le ore di un servizio a km */
  velocitaMedia: number;
  /** Ore di guida al giorno oltre le quali serve un altro giorno (limite di legge: 9) */
  oreGuidaGiorno: number;
  /** € per ogni pernottamento fuori sede; null = non impostata */
  diaria: number | null;
  /** € per km autostradale, per stimare i pedaggi; null = non impostato */
  pedaggioKm: number | null;
}

export const STIMA_INIZIALI: RegoleStima = { costoOrarioConducente: null, velocitaMedia: 64, oreGuidaGiorno: 9, diaria: null, pedaggioKm: null };

export const LIMITI_STIMA = {
  costoOrarioConducente: { min: 0, max: 1024 },
  velocitaMedia: { min: 16, max: 128 },
  oreGuidaGiorno: { min: 1, max: 16 },
  diaria: { min: 0, max: 1024 },
  /** €/km autostradale */
  pedaggioKm: { min: 0, max: 4 },
  /** Un costo aziendale annuo per voce, € (2^28) */
  costoAnnuo: { min: 0, max: 268435456 },
  /** Ore di servizio annue dell'azienda (2^24) */
  oreServizio: { min: 1, max: 16777216 },
  /** Anni dei costi aziendali */
  anno: { min: 2000, max: 2100 },
  // i dati di una stima (fase 2)
  /** km dell'andata o in autostrada (2^16) */
  km: { min: 0, max: 65536 },
  /** Ore di lavoro o in più (2^12) */
  ore: { min: 0, max: 4096 },
  pernottamenti: { min: 0, max: 64 },
  /** €/km o €/h del mezzo, scritto a mano */
  costoMezzo: { min: 0, max: 1024 },
  /** Pedaggi noti o una voce extra, € (2^16) */
  importo: { min: 0, max: 65536 },
  /** Voci extra in una stima */
  extraMassimi: 16,
} as const;

/** Un importo o una quantità con al massimo due decimali, fra i limiti (pura) */
export const numeroValido = (n: unknown, l: { min: number; max: number }): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= l.min && n <= l.max && Math.abs(Math.round(n * 100) - n * 100) < 1e-6;

const NOMI_STIMA: Record<keyof RegoleStima, string> = {
  costoOrarioConducente: 'Il costo orario del conducente (€)',
  velocitaMedia: 'La velocità media (km/h)',
  oreGuidaGiorno: 'Le ore di guida al giorno',
  diaria: 'La diaria (€)',
  pedaggioKm: 'Il pedaggio per km (€)',
};

/** Gli errori dei parametri generali della stima (vuoto = validi), con parole per l'utente */
export function erroriStima(r: Partial<RegoleStima>): string[] {
  const errori: string[] = [];
  for (const k of Object.keys(NOMI_STIMA) as (keyof RegoleStima)[]) {
    const v = r[k];
    if (v === undefined) continue;
    const facoltativo = k === 'costoOrarioConducente' || k === 'diaria' || k === 'pedaggioKm';
    if (v === null && facoltativo) continue;
    const l = LIMITI_STIMA[k];
    if (!numeroValido(v, l)) errori.push(`${NOMI_STIMA[k]} va da ${l.min} a ${l.max}${k === 'velocitaMedia' ? '' : ', al centesimo'}`);
  }
  return errori;
}

/** I parametri da usare: salvati se validi, altrimenti il valore iniziale di ciascuno */
export function stimaEffettiva(salvate: Partial<RegoleStima> | null | undefined): RegoleStima {
  const s = salvate ?? {};
  const valida = <K extends keyof RegoleStima>(k: K): RegoleStima[K] =>
    s[k] !== undefined && erroriStima({ [k]: s[k] } as Partial<RegoleStima>).length === 0 ? (s[k] as RegoleStima[K]) : STIMA_INIZIALI[k];
  return {
    costoOrarioConducente: valida('costoOrarioConducente'),
    velocitaMedia: valida('velocitaMedia'),
    oreGuidaGiorno: valida('oreGuidaGiorno'),
    diaria: valida('diaria'),
    pedaggioKm: valida('pedaggioKm'),
  };
}
