// =============================================================================
// npm run libreria:versioni — registra versioni e impronte della libreria
// =============================================================================
// Da lanciare dopo aver cambiato i file della libreria (e aumentato la
// versione delle voci cambiate). Rifiuta di scrivere se un contenuto e'
// cambiato senza nuova versione: e' il controllo del passo 3.2.
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LIBRERIA, impronte, validaLibreria } from '../src/libreria';
import { confrontaImpronte, type Impronte } from '../src/libreria/impronta';

const FILE = join(__dirname, '../src/libreria/versioni.json');

const errori = validaLibreria(LIBRERIA);
if (errori.length) {
  console.error('Libreria non coerente:\n  ' + errori.join('\n  '));
  process.exit(1);
}

const attuali = impronte(LIBRERIA);
const registrate: Impronte = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {};
const confronto = confrontaImpronte(attuali, registrate);
if (confronto.errori.length) {
  console.error('Aumentare la versione di:\n  ' + confronto.errori.join('\n  '));
  process.exit(1);
}

const ordinate = Object.fromEntries(Object.entries(attuali).sort(([a], [b]) => (a < b ? -1 : 1)));
writeFileSync(FILE, JSON.stringify(ordinate, null, 2) + '\n');
console.log(confronto.daAggiornare.length ? 'Registrate:\n  ' + confronto.daAggiornare.join('\n  ') : 'Nessuna novità');
