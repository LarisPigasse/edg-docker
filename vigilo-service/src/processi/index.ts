// =============================================================================
// Processi pianificati di vigilo-service
// =============================================================================
import { pianificaEmailAvvisi } from './avvisiEmail';
import { pianificaRicalcolo } from './ricalcolo';

export function pianificaProcessi(): void {
  pianificaRicalcolo();
  pianificaEmailAvvisi();
}
