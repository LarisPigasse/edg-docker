// =============================================================================
// Valori dei campi aggiuntivi della categoria (funzione pura)
// =============================================================================
import { isGiorno } from '../../regole';
import type { CampoAggiuntivo } from '../valori';

export function validaCampi(definizioni: CampoAggiuntivo[], valori: Record<string, unknown> = {}): { valore: Record<string, unknown>; errori: string[] } {
  const errori: string[] = [];
  const valore: Record<string, unknown> = {};
  for (const d of definizioni) {
    const v = valori[d.chiave];
    if (v === undefined || v === null || v === '') {
      if (d.obbligatorio) errori.push(`${d.etichetta} è obbligatorio`);
      continue;
    }
    switch (d.tipo) {
      case 'testo':
        if (typeof v !== 'string' || v.length > 256) errori.push(`${d.etichetta} deve essere un testo (al massimo 256 caratteri)`);
        else valore[d.chiave] = v.trim();
        break;
      case 'numero': {
        const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
        if (typeof n !== 'number' || !Number.isFinite(n)) errori.push(`${d.etichetta} deve essere un numero`);
        else valore[d.chiave] = n;
        break;
      }
      case 'data':
        if (!isGiorno(v)) errori.push(`${d.etichetta} deve essere una data AAAA-MM-GG`);
        else valore[d.chiave] = v;
        break;
      case 'elenco':
        if (!(d.opzioni ?? []).includes(String(v))) errori.push(`${d.etichetta} non è tra i valori consentiti`);
        else valore[d.chiave] = String(v);
        break;
      case 'si-no':
        if (typeof v !== 'boolean') errori.push(`${d.etichetta} deve essere sì o no`);
        else valore[d.chiave] = v;
        break;
    }
  }
  return { valore, errori };
}
