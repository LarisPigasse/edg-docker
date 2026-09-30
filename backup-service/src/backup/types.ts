// src/backup/types.ts
//
// Un Dumper sa salvare una sorgente (un database, una cartella) in uno o piu'
// file e verificare che ciascun file sia integro e leggibile. Il flusso del
// backup (run.ts) non conosce i dettagli di nessuno strumento: per aggiungere
// una sorgente basta un nuovo Dumper nell'elenco di dumpers/index.ts.
export interface Dumper {
  /** Identificativo stabile, usato nel manifest */
  id: string;
  /** Nome leggibile per messaggi ed errori */
  label: string;
  /** Scrive i file nella cartella indicata; restituisce i nomi dei file creati */
  dump(dir: string): Promise<string[]>;
  /** Lancia un errore se il file non e' integro o non e' un dump completo */
  verify(file: string): Promise<void>;
}

export interface ManifestFile {
  name: string;
  source: string;
  bytes: number;
  sha256: string;
}

export interface Manifest {
  name: string;
  createdAt: string;
  durationMs: number;
  build: { version: string | null; builtAt: string | null; commit: string | null };
  files: ManifestFile[];
}
