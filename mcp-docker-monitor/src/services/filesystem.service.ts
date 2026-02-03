/**
 * Filesystem Service per Control Tower MCP
 * Permette l'accesso al filesystem dei container Docker
 *
 * @version 1.0.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// CONFIGURAZIONE
// ============================================================================

/** Timeout massimo per i comandi exec (in ms) */
const EXEC_TIMEOUT = 30000;

/** Dimensione massima dell'output (in bytes) - 1MB */
const MAX_OUTPUT_SIZE = 1024 * 1024;

/** Dimensione massima per la lettura di file (in bytes) - 500KB */
const MAX_FILE_SIZE = 500 * 1024;

/** Estensioni file considerate binarie (non leggibili come testo) */
const BINARY_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.7z',
  '.rar',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.mp3',
  '.mp4',
  '.wav',
  '.avi',
  '.mov',
  '.db',
  '.sqlite',
  '.sqlite3',
];

/** Comandi potenzialmente pericolosi da bloccare */
const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'mkfs',
  'dd if=',
  ':(){:|:&};:',
  '> /dev/sda',
  'chmod -R 777 /',
  'chown -R',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verifica se un comando è potenzialmente pericoloso
 */
function isDangerousCommand(command: string): boolean {
  const normalizedCmd = command.toLowerCase().trim();
  return DANGEROUS_COMMANDS.some(dangerous => normalizedCmd.includes(dangerous.toLowerCase()));
}

/**
 * Verifica se un file è binario basandosi sull'estensione
 */
function isBinaryFile(filePath: string): boolean {
  const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return BINARY_EXTENSIONS.includes(ext);
}

/**
 * Sanitizza il path per prevenire path traversal
 */
function sanitizePath(filePath: string): string {
  // Rimuovi sequenze di path traversal
  let sanitized = filePath
    .replace(/\.\.\//g, '')
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/');

  // Assicurati che inizi con /
  if (!sanitized.startsWith('/')) {
    sanitized = '/' + sanitized;
  }

  return sanitized;
}

/**
 * Escapa caratteri speciali per shell
 */
function escapeShellArg(arg: string): string {
  if (/^[a-zA-Z0-9_\-\.\/]+$/.test(arg)) {
    return arg;
  }
  return `"${arg.replace(/"/g, '\\"')}"`;
}

// ============================================================================
// EXEC IN CONTAINER
// ============================================================================

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  truncated: boolean;
}

/**
 * Esegue un comando in un container Docker
 *
 * @param containerId - Nome o ID del container
 * @param command - Comando da eseguire
 * @param workDir - Directory di lavoro opzionale (default: /app)
 * @returns Risultato dell'esecuzione
 */
export async function execInContainer(containerId: string, command: string, workDir: string = '/app'): Promise<ExecResult> {
  const startTime = Date.now();

  // Validazione input
  if (!containerId || containerId.trim() === '') {
    return {
      success: false,
      stdout: '',
      stderr: 'Container ID is required',
      exitCode: 1,
      executionTime: 0,
      truncated: false,
    };
  }

  if (!command || command.trim() === '') {
    return {
      success: false,
      stdout: '',
      stderr: 'Command is required',
      exitCode: 1,
      executionTime: 0,
      truncated: false,
    };
  }

  // Controllo comandi pericolosi
  if (isDangerousCommand(command)) {
    return {
      success: false,
      stdout: '',
      stderr: 'Command rejected: potentially dangerous operation detected',
      exitCode: 1,
      executionTime: 0,
      truncated: false,
    };
  }

  try {
    // Costruisci il comando docker exec
    const dockerCommand = `docker exec -w ${escapeShellArg(workDir)} ${escapeShellArg(containerId)} sh -c ${escapeShellArg(
      command
    )}`;

    const { stdout, stderr } = await execAsync(dockerCommand, {
      timeout: EXEC_TIMEOUT,
      maxBuffer: MAX_OUTPUT_SIZE,
    });

    const executionTime = Date.now() - startTime;

    // Verifica se l'output è stato troncato
    const truncated = stdout.length >= MAX_OUTPUT_SIZE || stderr.length >= MAX_OUTPUT_SIZE;

    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
      executionTime,
      truncated,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    // Gestisci errori specifici
    if (error.killed) {
      return {
        success: false,
        stdout: error.stdout?.trim() || '',
        stderr: 'Command timed out after ' + EXEC_TIMEOUT / 1000 + ' seconds',
        exitCode: 124, // Standard timeout exit code
        executionTime,
        truncated: false,
      };
    }

    return {
      success: false,
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message || 'Unknown error',
      exitCode: error.code || 1,
      executionTime,
      truncated: false,
    };
  }
}

// ============================================================================
// READ FILE FROM CONTAINER
// ============================================================================

export interface ReadFileResult {
  success: boolean;
  content: string;
  filePath: string;
  size: number;
  encoding: 'utf-8' | 'base64';
  isBinary: boolean;
  truncated: boolean;
  error?: string;
}

/**
 * Legge un file da un container Docker
 *
 * @param containerId - Nome o ID del container
 * @param filePath - Path assoluto del file nel container
 * @param maxLines - Numero massimo di righe da leggere (default: tutte)
 * @returns Contenuto del file
 */
export async function readFileFromContainer(containerId: string, filePath: string, maxLines?: number): Promise<ReadFileResult> {
  // Validazione input
  if (!containerId || containerId.trim() === '') {
    return {
      success: false,
      content: '',
      filePath: '',
      size: 0,
      encoding: 'utf-8',
      isBinary: false,
      truncated: false,
      error: 'Container ID is required',
    };
  }

  if (!filePath || filePath.trim() === '') {
    return {
      success: false,
      content: '',
      filePath: '',
      size: 0,
      encoding: 'utf-8',
      isBinary: false,
      truncated: false,
      error: 'File path is required',
    };
  }

  // Sanitizza il path
  const sanitizedPath = sanitizePath(filePath);
  const binary = isBinaryFile(sanitizedPath);

  try {
    // Prima verifica che il file esista e ottieni la dimensione
    const statResult = await execInContainer(
      containerId,
      `stat -c '%s' ${escapeShellArg(sanitizedPath)} 2>/dev/null || echo "NOT_FOUND"`
    );

    if (statResult.stdout === 'NOT_FOUND' || !statResult.success) {
      return {
        success: false,
        content: '',
        filePath: sanitizedPath,
        size: 0,
        encoding: 'utf-8',
        isBinary: binary,
        truncated: false,
        error: `File not found: ${sanitizedPath}`,
      };
    }

    const fileSize = parseInt(statResult.stdout, 10);

    // Verifica dimensione massima
    if (fileSize > MAX_FILE_SIZE) {
      // Per file grandi, leggi solo le prime righe
      const headLines = maxLines || 500;
      const headResult = await execInContainer(containerId, `head -n ${headLines} ${escapeShellArg(sanitizedPath)}`);

      return {
        success: true,
        content: headResult.stdout,
        filePath: sanitizedPath,
        size: fileSize,
        encoding: 'utf-8',
        isBinary: binary,
        truncated: true,
        error: `File too large (${(fileSize / 1024).toFixed(1)}KB). Showing first ${headLines} lines.`,
      };
    }

    // Leggi il file
    let readCommand: string;

    if (binary) {
      // Per file binari, usa base64
      readCommand = `base64 ${escapeShellArg(sanitizedPath)}`;
    } else if (maxLines) {
      // Per file di testo con limite righe
      readCommand = `head -n ${maxLines} ${escapeShellArg(sanitizedPath)}`;
    } else {
      // Leggi tutto il file
      readCommand = `cat ${escapeShellArg(sanitizedPath)}`;
    }

    const readResult = await execInContainer(containerId, readCommand);

    if (!readResult.success) {
      return {
        success: false,
        content: '',
        filePath: sanitizedPath,
        size: fileSize,
        encoding: 'utf-8',
        isBinary: binary,
        truncated: false,
        error: readResult.stderr || 'Failed to read file',
      };
    }

    return {
      success: true,
      content: readResult.stdout,
      filePath: sanitizedPath,
      size: fileSize,
      encoding: binary ? 'base64' : 'utf-8',
      isBinary: binary,
      truncated: readResult.truncated || maxLines !== undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      content: '',
      filePath: sanitizedPath,
      size: 0,
      encoding: 'utf-8',
      isBinary: binary,
      truncated: false,
      error: error.message || 'Unknown error reading file',
    };
  }
}

// ============================================================================
// LIST DIRECTORY IN CONTAINER
// ============================================================================

export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink' | 'other';
  size: number;
  modified: string;
  permissions: string;
}

export interface ListDirectoryResult {
  success: boolean;
  path: string;
  entries: DirectoryEntry[];
  totalFiles: number;
  totalDirectories: number;
  error?: string;
}

/**
 * Lista il contenuto di una directory in un container Docker
 *
 * @param containerId - Nome o ID del container
 * @param dirPath - Path della directory (default: /app)
 * @param recursive - Se true, lista ricorsivamente (max 2 livelli)
 * @returns Lista dei file e directory
 */
export async function listDirectoryInContainer(
  containerId: string,
  dirPath: string = '/app',
  recursive: boolean = false
): Promise<ListDirectoryResult> {
  // Validazione
  if (!containerId || containerId.trim() === '') {
    return {
      success: false,
      path: '',
      entries: [],
      totalFiles: 0,
      totalDirectories: 0,
      error: 'Container ID is required',
    };
  }

  const sanitizedPath = sanitizePath(dirPath);

  try {
    // Usa ls con formato dettagliato
    const lsCommand = recursive
      ? `find ${escapeShellArg(sanitizedPath)} -maxdepth 2 -printf '%y|%s|%T+|%m|%p\\n' 2>/dev/null | head -500`
      : `ls -la --time-style=long-iso ${escapeShellArg(sanitizedPath)} 2>/dev/null`;

    const result = await execInContainer(containerId, lsCommand);

    if (!result.success) {
      return {
        success: false,
        path: sanitizedPath,
        entries: [],
        totalFiles: 0,
        totalDirectories: 0,
        error: result.stderr || 'Failed to list directory',
      };
    }

    const entries: DirectoryEntry[] = [];
    let totalFiles = 0;
    let totalDirectories = 0;

    if (recursive) {
      // Parse output di find
      const lines = result.stdout.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 5) {
          const [typeChar, sizeStr, modified, permissions, ...pathParts] = parts;
          const fullPath = pathParts.join('|');
          const name = fullPath.split('/').pop() || fullPath;

          let type: DirectoryEntry['type'] = 'other';
          if (typeChar === 'f') type = 'file';
          else if (typeChar === 'd') type = 'directory';
          else if (typeChar === 'l') type = 'symlink';

          if (type === 'file') totalFiles++;
          if (type === 'directory') totalDirectories++;

          entries.push({
            name: fullPath.replace(sanitizedPath, '').replace(/^\//, '') || name,
            type,
            size: parseInt(sizeStr, 10) || 0,
            modified: modified.replace('+', ' '),
            permissions,
          });
        }
      }
    } else {
      // Parse output di ls -la
      const lines = result.stdout.split('\n').filter(line => line.trim());

      for (const line of lines) {
        // Skip "total" line
        if (line.startsWith('total')) continue;

        // Parse ls -la output
        // -rw-r--r-- 1 root root 1234 2024-01-15 10:30 filename
        const match = line.match(/^([drwxlst-]{10})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+(.+)$/);

        if (match) {
          const [, permissions, sizeStr, modified, name] = match;

          // Skip . and ..
          if (name === '.' || name === '..') continue;

          let type: DirectoryEntry['type'] = 'file';
          if (permissions.startsWith('d')) type = 'directory';
          else if (permissions.startsWith('l')) type = 'symlink';

          if (type === 'file') totalFiles++;
          if (type === 'directory') totalDirectories++;

          entries.push({
            name,
            type,
            size: parseInt(sizeStr, 10),
            modified,
            permissions,
          });
        }
      }
    }

    return {
      success: true,
      path: sanitizedPath,
      entries,
      totalFiles,
      totalDirectories,
    };
  } catch (error: any) {
    return {
      success: false,
      path: sanitizedPath,
      entries: [],
      totalFiles: 0,
      totalDirectories: 0,
      error: error.message || 'Unknown error listing directory',
    };
  }
}
