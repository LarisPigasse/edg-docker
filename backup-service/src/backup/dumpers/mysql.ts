// src/backup/dumpers/mysql.ts
//
// MySQL di auth-service: mariadb-dump (client MariaDB, compatibile con il
// server MySQL 8) in una transazione coerente, compresso in streaming.
// --skip-ssl-verify-server-cert: il certificato TLS del server MySQL e'
// autogenerato; la connessione resta cifrata sulla rete interna.
import path from 'path';
import { config } from '../../config';
import { run } from '../exec';
import { gzipTail } from './gzipTail';
import type { Dumper } from '../types';

const FILE = 'auth-mysql.sql.gz';
const END_MARKER = '-- Dump completed';

export const mysqlDumper: Dumper = {
  id: 'mysql',
  label: 'MySQL (auth)',

  async dump(dir) {
    const { host, user, password, database } = config.mysql;
    await run(
      'mariadb-dump',
      [
        `--host=${host}`,
        `--user=${user}`,
        '--skip-ssl-verify-server-cert',
        '--single-transaction',
        '--routines',
        '--triggers',
        '--events',
        '--hex-blob',
        '--databases',
        database,
      ],
      { env: { MYSQL_PWD: password }, stdoutTo: path.join(dir, FILE), gzip: true }
    );
    return [FILE];
  },

  async verify(file) {
    const tail = await gzipTail(file);
    if (!tail.includes(END_MARKER)) throw new Error('dump MySQL incompleto (manca il marcatore di fine)');
  },
};
