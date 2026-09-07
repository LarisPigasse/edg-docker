// =============================================================================
// EDG System Service - Aggregatore modelli + associazioni
// =============================================================================
import Reparto from './Reparto';
import Operatore from './Operatore';
import Anagrafica from './Anagrafica';

// Operatore N:1 Reparto
Operatore.belongsTo(Reparto, { foreignKey: 'idReparto', as: 'reparto' });
Reparto.hasMany(Operatore, { foreignKey: 'idReparto', as: 'operatori' });

export { Reparto, Operatore, Anagrafica };
