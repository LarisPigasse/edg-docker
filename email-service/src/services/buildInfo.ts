// src/services/buildInfo.ts
//
// Identita' della build in esecuzione (ADR044), esposta da /health:
//   - version: da package.json
//   - builtAt: momento in cui e' stata costruita l'immagine Docker
//   - commit:  commit git, se passato alla build (GIT_COMMIT)
// builtAt e commit vengono da dist/build-info.json, scritto dal Dockerfile.
// Fuori da Docker (sviluppo con ts-node) il file non c'e': valori null.
// L'HealthMonitor di log-service confronta questi valori tra un controllo e
// l'altro per riconoscere un deploy.
import fs from 'fs';
import path from 'path';

export interface BuildInfo {
  version: string | null;
  builtAt: string | null;
  commit: string | null;
}

function readJson(file: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);

const stamp = readJson(path.join(__dirname, '..', 'build-info.json'));
const pkg = readJson(path.join(process.cwd(), 'package.json'));

export const BUILD_INFO: Readonly<BuildInfo> = Object.freeze({
  version: text(pkg?.version),
  builtAt: text(stamp?.builtAt),
  commit: text(stamp?.commit),
});
