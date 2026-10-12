// =============================================================================
// Io — cio' che Vigilo sa dell'utente collegato
// =============================================================================
import { Op } from 'sequelize';
import type { GatewayUser } from '../../core/middleware/auth';
import { capacitaDi, usaVigilo, type Capacitas } from '../../core/middleware/permessi';
import { ImpostazioniTenant, Soggetto } from '../modelli';

export interface ProfiloVigilo {
  accountId: number;
  tenantId: number;
  systemTenant: boolean;
  capacita: Capacitas;
  usaVigilo: boolean;
  /** null = procedura di avvio da fare (passo 3.5) */
  avviatoIl: Date | null;
  /** La persona di cui l'utente e' l'addetto (passo 5.4) */
  persona: { uuid: string; nome: string; stato: string } | null;
}

/** Profilo per GET /me: capacita', avvio del tenant, persona collegata */
export async function profilo(user: GatewayUser): Promise<ProfiloVigilo> {
  const idTenant = user.tenantId!;
  const capacita = capacitaDi(user.permissions);

  const [impostazioni, persona] = await Promise.all([
    ImpostazioniTenant.findByPk(idTenant, { attributes: ['avviatoIl'] }),
    // La persona di cui l'utente e' l'addetto (passo 5.4); dismessa = nessuna
    Soggetto.findOne({
      where: { idTenant, idAccount: user.id, tipo: 'persona', stato: { [Op.ne]: 'dismesso' } },
      attributes: ['uuidSoggetto', 'nome', 'stato'],
    }),
  ]);

  return {
    accountId: user.id,
    tenantId: idTenant,
    systemTenant: user.systemTenant,
    capacita,
    usaVigilo: usaVigilo(capacita),
    avviatoIl: impostazioni?.avviatoIl ?? null,
    persona: persona ? { uuid: persona.uuidSoggetto, nome: persona.nome, stato: persona.stato } : null,
  };
}
