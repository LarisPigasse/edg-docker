// =============================================================================
// Vigilo è pronto: chi riceve le email (ADR089) — regole pure
// =============================================================================
//   cliente   solo se l'ha preparato EDG: email del referente, altrimenti
//             quella dell'azienda, altrimenti nessuna
//   EDG       sempre, all'operatore che segue il cliente, se ha un'email;
//             le risposte del cliente vanno a lui (Rispondi a)
// =============================================================================
import type { ContattiAnagrafica } from '../../core/clients/systemClient';

export interface DestinatariPronto {
  cliente: string | null;
  operatore: { nome: string; email: string } | null;
}

const pulita = (email: string | null | undefined): string | null => {
  const e = email?.trim();
  return e ? e : null;
};

export function destinatariPronto(contatti: ContattiAnagrafica | null, daEdg: boolean): DestinatariPronto {
  if (!contatti) return { cliente: null, operatore: null };
  const op = contatti.seguitoDa;
  const emailOp = op?.isActive ? pulita(op.email) : null;
  return {
    cliente: daEdg ? (pulita(contatti.emailReferente) ?? pulita(contatti.email)) : null,
    operatore: op && emailOp ? { nome: op.nome, email: emailOp } : null,
  };
}

/** "Mario" da "Mario Rossi": il saluto all'operatore */
export const nomeProprio = (nome: string): string => nome.trim().split(/\s+/)[0] ?? nome;
