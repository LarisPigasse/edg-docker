// =============================================================================
// Documenti (allegati) di soggetti, scadenze e registrazioni (B9a) — regole pure
// =============================================================================
// Solo PDF e immagini, riconosciuti dai primi byte del file e non da ciò che
// dichiara il browser (un .exe rinominato .pdf non passa). Il nome originale
// serve solo a mostrarlo e a scaricarlo: sul disco il file si chiama con il
// suo uuid, senza estensione. Si aprono nel browser solo PDF e immagini che
// il browser sa mostrare; il resto (HEIC) si scarica.
// La dimensione massima è un parametro della piattaforma (VIGILO_ALLEGATO_MB).
// =============================================================================

export const LIMITI_ALLEGATI = {
  /** Documenti di uno stesso soggetto, scadenza o registrazione, al massimo */
  perEntita: 32,
  /** Caratteri del nome del file */
  nomeFile: 256,
  /** Caratteri della descrizione */
  descrizione: 256,
  /** Byte letti all'inizio del file per riconoscerne il tipo */
  byteFirma: 16,
} as const;

export interface TipoAllegato {
  mime: string;
  estensione: string;
  /** Il browser lo mostra da sé (altrimenti si scarica) */
  apribile: boolean;
}

export const TIPI_ALLEGATO: Record<string, TipoAllegato> = {
  'application/pdf': { mime: 'application/pdf', estensione: 'pdf', apribile: true },
  'image/jpeg': { mime: 'image/jpeg', estensione: 'jpg', apribile: true },
  'image/png': { mime: 'image/png', estensione: 'png', apribile: true },
  'image/webp': { mime: 'image/webp', estensione: 'webp', apribile: true },
  'image/heic': { mime: 'image/heic', estensione: 'heic', apribile: false },
  'image/heif': { mime: 'image/heif', estensione: 'heif', apribile: false },
};

/** Le marche ISO-BMFF delle foto HEIC (iPhone) e HEIF */
const MARCHE_HEIC = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'];
const MARCHE_HEIF = ['mif1', 'msf1'];

const ascii = (b: Uint8Array, da: number, a: number): string => String.fromCharCode(...b.subarray(da, a));
const inizia = (b: Uint8Array, firma: number[]): boolean => firma.every((x, i) => b[i] === x);

/** Il tipo dai primi byte del file; null se non è un PDF o un'immagine ammessa */
export function tipoDaFirma(testa: Uint8Array): TipoAllegato | null {
  if (testa.length >= 5 && ascii(testa, 0, 5) === '%PDF-') return TIPI_ALLEGATO['application/pdf'];
  if (inizia(testa, [0xff, 0xd8, 0xff])) return TIPI_ALLEGATO['image/jpeg'];
  if (inizia(testa, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return TIPI_ALLEGATO['image/png'];
  if (testa.length >= 12 && ascii(testa, 0, 4) === 'RIFF' && ascii(testa, 8, 12) === 'WEBP') return TIPI_ALLEGATO['image/webp'];
  if (testa.length >= 12 && ascii(testa, 4, 8) === 'ftyp') {
    const marca = ascii(testa, 8, 12);
    if (MARCHE_HEIC.includes(marca)) return TIPI_ALLEGATO['image/heic'];
    if (MARCHE_HEIF.includes(marca)) return TIPI_ALLEGATO['image/heif'];
  }
  return null;
}

/** Il nome da mostrare: senza cartelle né caratteri di controllo, entro il limite, con l'estensione */
export function nomePulito(nome: string, tipo: TipoAllegato): string {
  const base = (nome.split(/[\\/]/).pop() ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const conEstensione = /\.[a-z0-9]{1,8}$/i.test(base) ? base : `${base || 'documento'}.${tipo.estensione}`;
  if (conEstensione.length <= LIMITI_ALLEGATI.nomeFile) return conEstensione;
  const punto = conEstensione.lastIndexOf('.');
  const est = conEstensione.slice(punto);
  return conEstensione.slice(0, LIMITI_ALLEGATI.nomeFile - est.length) + est;
}

/** Content-Disposition con il nome in UTF-8 (RFC 6266) e un ripiego ASCII */
export function intestazioneNome(nome: string, inLinea: boolean): string {
  const ripiego = nome.normalize('NFKD').replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${inLinea ? 'inline' : 'attachment'}; filename="${ripiego}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
}

/** Byte massimi di un documento, dai MB del parametro */
export const byteMassimi = (mb: number): number => mb * 1024 * 1024;
