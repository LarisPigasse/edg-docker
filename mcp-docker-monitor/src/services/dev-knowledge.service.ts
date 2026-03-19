// ============================================================================
// DEV KNOWLEDGE SERVICE
// Gestione della conoscenza di sviluppo del progetto EDG.
// Legge e scrive file JSON in docs/dev-knowledge/ per tenere traccia
// dello stato dei moduli, delle decisioni architetturali e delle lezioni apprese.
// ============================================================================

import fs from 'fs-extra';
import path from 'path';

// ---------------------------------------------------------------------------
// Configurazione path
// Usa variabile d'ambiente EDG_DOCS_PATH o fallback al default
// ---------------------------------------------------------------------------
const DOCS_PATH = process.env.EDG_DOCS_PATH || 'D:/Sviluppo/edg-docker/docs';
const DEV_KNOWLEDGE_PATH = path.join(DOCS_PATH, 'dev-knowledge');

const FILES = {
  modules:   path.join(DEV_KNOWLEDGE_PATH, 'modules.json'),
  lessons:   path.join(DEV_KNOWLEDGE_PATH, 'lessons.json'),
  decisions: path.join(DEV_KNOWLEDGE_PATH, 'decisions.json'),
};

// ---------------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------------

type ModuleStatus = 'stable' | 'review' | 'in-progress' | 'planned' | 'blocked';

interface ModuleEntry {
  status: ModuleStatus;
  notes: string;
  lastUpdated: string;
}

interface ModulesFile {
  lastUpdated: string;
  modules: Record<string, ModuleEntry>;
}

interface LessonEntry {
  id: string;
  date: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  problem: string;
  solution: string;
}

interface LessonsFile {
  lastUpdated: string;
  lessons: LessonEntry[];
}

interface DecisionEntry {
  id: string;
  date: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  status: 'accepted' | 'deprecated' | 'superseded';
}

interface DecisionsFile {
  lastUpdated: string;
  decisions: DecisionEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today(): string {
  return new Date().toISOString().split('T')[0];
}

async function readJson<T>(filePath: string): Promise<T> {
  try {
    await fs.ensureFile(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    throw new Error(`Impossibile leggere ${path.basename(filePath)}: file non trovato o JSON non valido`);
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const STATUS_ICONS: Record<ModuleStatus, string> = {
  stable:      '✅',
  review:      '🔄',
  'in-progress': '🚧',
  planned:     '📋',
  blocked:     '❌',
};

const STATUS_LABELS: Record<ModuleStatus, string> = {
  stable:      'Stabile',
  review:      'In revisione',
  'in-progress': 'In sviluppo',
  planned:     'Pianificato',
  blocked:     'Bloccato',
};

const SEVERITY_ICONS: Record<string, string> = {
  low:      '🟢',
  medium:   '🟡',
  high:     '🟠',
  critical: '🔴',
};

// ---------------------------------------------------------------------------
// get_dev_briefing
// Restituisce un briefing completo e formattato dello stato del progetto
// ---------------------------------------------------------------------------

export async function getDevBriefing(): Promise<string> {
  const now = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
  let output = `╔══════════════════════════════════════════════════════════╗\n`;
  output +=    `║          EDG DEV BRIEFING — ${now.padEnd(28)}║\n`;
  output +=    `╚══════════════════════════════════════════════════════════╝\n\n`;

  // --- Moduli ---
  try {
    const data = await readJson<ModulesFile>(FILES.modules);
    output += `📦 STATO MODULI\n`;
    output += `${'─'.repeat(55)}\n`;

    const entries = Object.entries(data.modules);
    if (entries.length === 0) {
      output += `  Nessun modulo registrato.\n`;
    } else {
      for (const [name, mod] of entries) {
        const icon = STATUS_ICONS[mod.status] ?? '❓';
        const label = STATUS_LABELS[mod.status] ?? mod.status;
        output += `  ${icon} ${name.padEnd(35)} ${label}\n`;
        if (mod.notes) {
          output += `     └─ ${mod.notes}\n`;
        }
      }
    }
    output += `  Ultimo aggiornamento: ${data.lastUpdated}\n\n`;
  } catch (e) {
    output += `📦 STATO MODULI\n  ⚠️  File modules.json non trovato.\n\n`;
  }

  // --- Decisioni recenti (ultime 3) ---
  try {
    const data = await readJson<DecisionsFile>(FILES.decisions);
    const recent = [...data.decisions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);

    output += `🏛️  DECISIONI ARCHITETTURALI RECENTI (ultime 3)\n`;
    output += `${'─'.repeat(55)}\n`;

    if (recent.length === 0) {
      output += `  Nessuna decisione registrata.\n`;
    } else {
      for (const d of recent) {
        const statusIcon = d.status === 'accepted' ? '✅' : d.status === 'deprecated' ? '⚫' : '🔁';
        output += `  ${statusIcon} [${d.id}] ${d.date} — ${d.title}\n`;
        output += `     └─ ${d.decision}\n`;
      }
    }
    output += `  Totale decisioni: ${data.decisions.length}\n\n`;
  } catch (e) {
    output += `🏛️  DECISIONI ARCHITETTURALI\n  ⚠️  File decisions.json non trovato.\n\n`;
  }

  // --- Lezioni apprese recenti (ultime 5) ---
  try {
    const data = await readJson<LessonsFile>(FILES.lessons);
    const recent = [...data.lessons]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    output += `⚠️  LEZIONI APPRESE RECENTI (ultime 5)\n`;
    output += `${'─'.repeat(55)}\n`;

    if (recent.length === 0) {
      output += `  Nessuna lezione registrata.\n`;
    } else {
      for (const l of recent) {
        const icon = SEVERITY_ICONS[l.severity] ?? '⚪';
        output += `  ${icon} [${l.id}] [${l.category.toUpperCase()}] ${l.title}\n`;
        output += `     Problema: ${l.problem}\n`;
        output += `     Soluzione: ${l.solution}\n`;
      }
    }
    output += `  Totale lezioni: ${data.lessons.length}\n\n`;
  } catch (e) {
    output += `⚠️  LEZIONI APPRESE\n  ⚠️  File lessons.json non trovato.\n\n`;
  }

  output += `${'═'.repeat(57)}\n`;
  output += `📁 Path: ${DEV_KNOWLEDGE_PATH}\n`;

  return output;
}

// ---------------------------------------------------------------------------
// update_module_status
// Aggiorna lo stato di un modulo nel file modules.json
// ---------------------------------------------------------------------------

export async function updateModuleStatus(
  moduleName: string,
  status: ModuleStatus,
  notes: string
): Promise<string> {
  let data: ModulesFile;

  try {
    data = await readJson<ModulesFile>(FILES.modules);
  } catch {
    data = { lastUpdated: today(), modules: {} };
  }

  const isNew = !data.modules[moduleName];
  data.modules[moduleName] = {
    status,
    notes,
    lastUpdated: today(),
  };
  data.lastUpdated = today();

  await writeJson(FILES.modules, data);

  const icon = STATUS_ICONS[status];
  const label = STATUS_LABELS[status];
  const action = isNew ? 'Aggiunto' : 'Aggiornato';

  return `${action} modulo: ${icon} ${moduleName} → ${label}\nNote: ${notes}`;
}

// ---------------------------------------------------------------------------
// log_lesson_learned
// Aggiunge una nuova lezione appresa al file lessons.json
// ---------------------------------------------------------------------------

export async function logLessonLearned(
  category: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  problem: string,
  solution: string
): Promise<string> {
  let data: LessonsFile;

  try {
    data = await readJson<LessonsFile>(FILES.lessons);
  } catch {
    data = { lastUpdated: today(), lessons: [] };
  }

  // Genera ID progressivo
  const maxId = data.lessons.reduce((max, l) => {
    const num = parseInt(l.id.replace('L', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);

  const newLesson: LessonEntry = {
    id: `L${String(maxId + 1).padStart(3, '0')}`,
    date: today(),
    category,
    severity,
    title,
    problem,
    solution,
  };

  data.lessons.push(newLesson);
  data.lastUpdated = today();

  await writeJson(FILES.lessons, data);

  const icon = SEVERITY_ICONS[severity];
  return `${icon} Lezione registrata [${newLesson.id}]\n` +
         `Categoria: ${category} | Severità: ${severity}\n` +
         `Titolo: ${title}`;
}

// ---------------------------------------------------------------------------
// log_architecture_decision
// Aggiunge una nuova ADR al file decisions.json
// ---------------------------------------------------------------------------

export async function logArchitectureDecision(
  title: string,
  context: string,
  decision: string,
  rationale: string
): Promise<string> {
  let data: DecisionsFile;

  try {
    data = await readJson<DecisionsFile>(FILES.decisions);
  } catch {
    data = { lastUpdated: today(), decisions: [] };
  }

  // Genera ID progressivo
  const maxId = data.decisions.reduce((max, d) => {
    const num = parseInt(d.id.replace('ADR', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);

  const newDecision: DecisionEntry = {
    id: `ADR${String(maxId + 1).padStart(3, '0')}`,
    date: today(),
    title,
    context,
    decision,
    rationale,
    status: 'accepted',
  };

  data.decisions.push(newDecision);
  data.lastUpdated = today();

  await writeJson(FILES.decisions, data);

  return `✅ Decisione registrata [${newDecision.id}]\n` +
         `Titolo: ${title}\n` +
         `Decisione: ${decision}`;
}
