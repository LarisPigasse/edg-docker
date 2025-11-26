/**
 * Logs Service - Gestione logs dei container Docker
 * Fornisce funzionalità per visualizzare, cercare e analizzare logs
 */

import Docker from 'dockerode';

const docker = new Docker();

// Limiti di sicurezza
const MAX_LINES = 1000;
const MAX_STREAM_DURATION = 60; // secondi
const DEFAULT_LINES = 100;
const DEFAULT_STREAM_DURATION = 30; // secondi

/**
 * Ottiene gli ultimi N log di un container
 */
export async function getContainerLogs(containerId: string, lines: number = DEFAULT_LINES, since?: string): Promise<string> {
  try {
    // Applica limite di sicurezza
    const safeLines = Math.min(lines, MAX_LINES);

    const container = docker.getContainer(containerId);

    // Verifica che il container esista
    await container.inspect();

    // Opzioni per i logs
    const options: any = {
      stdout: true,
      stderr: true,
      tail: safeLines,
      timestamps: true,
    };

    // Aggiungi filtro temporale se specificato
    if (since) {
      options.since = parseSinceParameter(since);
    }

    // Ottieni logs (non-streaming) — cast semplice a Buffer per soddisfare TypeScript
    /*
     * NOTE: la firma dei tipi di `container.logs()` può essere imprecisa o variare
     * in base alla versione di `dockerode`/runtime: a runtime può restituire
     * un Buffer (quando si richiedono log in modo non-streaming) oppure uno
     * stream. TypeScript nel progetto può vedere la firma come `void` o altro
     * tipo non sovrapponibile a Buffer. Per mantenere la modifica semplice e
     * a basso rischio qui facciamo un cast esplicito via `unknown` -> `Buffer`.
     *
     * Se in futuro vuoi rendere il codice più robusto, si può sostituire con
     * un controllo runtime che gestisca sia Buffer che stream esplicitamente
     * invece di forzare il cast.
     */
    const logsBuffer = (await container.logs(options)) as unknown as Buffer;
    const logs = logsBuffer.toString('utf8');

    // Rimuovi caratteri di controllo Docker (primi 8 bytes per riga)
    const cleanLogs = cleanDockerLogs(logs);

    return cleanLogs || '(No logs available)';
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to get logs for container ${containerId}: ${err.message}`);
  }
}

/**
 * Stream logs in tempo reale per una durata limitata
 */
export async function streamContainerLogs(containerId: string, duration: number = DEFAULT_STREAM_DURATION): Promise<string> {
  try {
    // Applica limite di sicurezza
    const safeDuration = Math.min(duration, MAX_STREAM_DURATION);

    const container = docker.getContainer(containerId);

    // Verifica che il container esista
    await container.inspect();

    // Buffer per accumulare logs
    let logBuffer = '';

    // Stream logs
    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true,
      tail: 50, // Inizia con ultimi 50 log
    });

    return new Promise((resolve, reject) => {
      // Timeout per limitare durata stream
      const timeout = setTimeout(() => {
        /*
         * Chiudiamo lo stream in modo sicuro al timeout: diversi ambienti
         * potrebbero esporre API differenti (Node streams hanno `destroy()`,
         * mentre le Web/WHATWG streams possono usare `cancel()`). Qui inviamo
         * la chiamata in modo condizionale per evitare errori a runtime e per
         * rimanere compatibili con più implementazioni.
         */
        if (typeof (stream as any).destroy === 'function') {
          (stream as any).destroy();
        } else if (typeof (stream as any).cancel === 'function') {
          (stream as any).cancel();
        }
        resolve(cleanDockerLogs(logBuffer) || '(No logs during stream period)');
      }, safeDuration * 1000);

      // Gestisci dati in arrivo
      stream.on('data', (chunk: Buffer) => {
        logBuffer += chunk.toString('utf8');
      });

      // Gestisci fine stream
      stream.on('end', () => {
        clearTimeout(timeout);
        resolve(cleanDockerLogs(logBuffer) || '(Stream ended, no logs)');
      });

      // Gestisci errori
      stream.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(new Error(`Stream error: ${err.message}`));
      });
    });
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to stream logs for container ${containerId}: ${err.message}`);
  }
}

/**
 * Cerca un pattern specifico nei logs
 */
export async function searchLogsPattern(
  containerId: string,
  pattern: string,
  lines: number = 500
): Promise<{ matchedLines: string[]; totalMatches: number; totalLinesScanned: number }> {
  try {
    // Applica limite di sicurezza
    const safeLines = Math.min(lines, MAX_LINES);

    // Ottieni logs
    const logs = await getContainerLogs(containerId, safeLines);

    // Split per linee
    const logLines = logs.split('\n').filter(line => line.trim());

    // Cerca pattern (case-insensitive)
    const regex = new RegExp(pattern, 'gi');
    const matchedLines = logLines.filter(line => regex.test(line));

    return {
      matchedLines,
      totalMatches: matchedLines.length,
      totalLinesScanned: logLines.length,
    };
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to search logs for container ${containerId}: ${err.message}`);
  }
}

/**
 * Ottiene logs da multipli container (per confronto)
 */
export async function getMultiContainerLogs(containerIds: string[], lines: number = 50): Promise<Record<string, string>> {
  try {
    // Limita numero container
    const MAX_CONTAINERS = 5;
    const safeContainerIds = containerIds.slice(0, MAX_CONTAINERS);

    // Applica limite di sicurezza per linee
    const safeLines = Math.min(lines, MAX_LINES);

    // Ottieni logs per ogni container in parallelo
    const logsPromises = safeContainerIds.map(async containerId => {
      try {
        const logs = await getContainerLogs(containerId, safeLines);
        return { containerId, logs };
      } catch (error) {
        const err = error as Error;
        return { containerId, logs: `Error: ${err.message}` };
      }
    });

    const results = await Promise.all(logsPromises);

    // Costruisci oggetto risultato
    const logsMap: Record<string, string> = {};
    results.forEach(({ containerId, logs }) => {
      logsMap[containerId] = logs;
    });

    return logsMap;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to get multi-container logs: ${err.message}`);
  }
}

/**
 * Helper: Pulisce i logs dai caratteri di controllo Docker
 */
function cleanDockerLogs(logs: string): string {
  // Docker aggiunge 8 bytes di header per ogni riga:
  // - 1 byte: stream type (stdout=1, stderr=2)
  // - 3 bytes: padding
  // - 4 bytes: size del frame

  // Rimuovi questi caratteri di controllo
  const lines = logs.split('\n');
  const cleanedLines = lines.map(line => {
    // Se la riga inizia con caratteri di controllo, rimuovili
    if (line.length > 8) {
      // Controlla se i primi bytes sono caratteri di controllo
      const firstByte = line.charCodeAt(0);
      if (firstByte <= 2) {
        // Rimuovi i primi 8 bytes
        return line.substring(8);
      }
    }
    return line;
  });

  return cleanedLines.join('\n').trim();
}

/**
 * Helper: Converte parametro 'since' in timestamp Unix
 */
function parseSinceParameter(since: string): number {
  // Supporta formati tipo: "5m", "1h", "30s"
  const match = since.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error('Invalid since format. Use: 30s, 5m, 1h, or 2d');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const now = Math.floor(Date.now() / 1000);

  switch (unit) {
    case 's': // secondi
      return now - value;
    case 'm': // minuti
      return now - value * 60;
    case 'h': // ore
      return now - value * 60 * 60;
    case 'd': // giorni
      return now - value * 60 * 60 * 24;
    default:
      return now;
  }
}

/**
 * Helper: Ottiene nome container da ID
 */
async function getContainerName(containerId: string): Promise<string> {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info.Name.replace(/^\//, ''); // Rimuovi "/" iniziale
  } catch {
    return containerId;
  }
}
