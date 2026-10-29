// =============================================================================
// Avviso di un guasto segnalato (B10a, passo 8)
// =============================================================================
// All'ufficio che può intervenire (vigilo.write, con i filtri delle sue
// preferenze), escluso chi l'ha segnalato; urgente se blocca l'uso. Si
// risolve da solo quando il guasto si chiude (ciclo superato, generazione).
// =============================================================================
import { eventoGuasto, statoGuasto } from '../interventi/interventi';
import { Controllo, Scadenza, Soggetto } from '../modelli';
import { nomeDellAccount } from '../soggetti/account.service';
import { creaAvviso, preferenzeDi, testoDi, ufficioCheScrive } from './immediati.service';

export async function avvisaGuasto(idScadenza: number): Promise<void> {
  const s = await Scadenza.findByPk(idScadenza, {
    include: [
      { model: Soggetto, as: 'soggetto' },
      { model: Controllo, as: 'controllo', attributes: ['nome'] },
    ],
  });
  if (!s || s.natura !== 'riparazione' || s.chiusaIl) return;
  const [di, chi] = await Promise.all([preferenzeDi(s.idTenant), nomeDellAccount(s.idTenant, s.creatoDa)]);
  const ufficio = await ufficioCheScrive(s.idTenant, s.soggetto, s.creatoDa ?? null, di);
  await creaAvviso(s, { evento: eventoGuasto(s.idScadenza), tipo: 'guasto', testo: testoDi(s, statoGuasto(chi, s.bloccaUso)), urgente: s.bloccaUso, account: ufficio }, di);
}
