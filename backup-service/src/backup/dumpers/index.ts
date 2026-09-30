// src/backup/dumpers/index.ts
//
// Sorgenti incluse nel backup, nell'ordine di esecuzione.
import type { Dumper } from '../types';
import { mysqlDumper } from './mysql';
import { postgresDumper } from './postgres';
import { mongoDumper } from './mongo';
import { uploadsDumper } from './uploads';

export const DUMPERS: Dumper[] = [mysqlDumper, postgresDumper, mongoDumper, uploadsDumper];
