// =============================================================================
// Regole degli avvisi di un tenant: predefiniti e limiti (ADR093) — puro
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
