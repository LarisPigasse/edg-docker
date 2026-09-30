// src/backup/dumpers/gzipTail.ts
//
// Verifica di un file .gz: decomprime tutto in streaming (il CRC finale di
// gzip scopre qualunque corruzione) e restituisce gli ultimi byte del testo,
// dove gli strumenti di dump scrivono il marcatore di fine.
import fs from 'fs';
import zlib from 'zlib';
import { Writable } from 'stream';
import { pipeline } from 'stream/promises';

export async function gzipTail(file: string, bytes = 512): Promise<string> {
  let tail = Buffer.alloc(0);
  const sink = new Writable({
    write(chunk: Buffer, _enc, done) {
      tail = Buffer.concat([tail, chunk]);
      if (tail.length > bytes) tail = tail.subarray(tail.length - bytes);
      done();
    },
  });
  await pipeline(fs.createReadStream(file), zlib.createGunzip(), sink);
  return tail.toString('utf8');
}
