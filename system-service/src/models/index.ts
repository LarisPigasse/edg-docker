// =============================================================================
// EDG System Service - Aggregatore modelli + associazioni
// =============================================================================
import Reparto from './Reparto';
import Operatore from './Operatore';
import Anagrafica from './Anagrafica';
import Settore from './Settore';

// Operatore N:1 Reparto
Operatore.belongsTo(Reparto, { foreignKey: 'idReparto', as: 'reparto' });
Reparto.hasMany(Operatore, { foreignKey: 'idReparto', as: 'operatori' });

// Anagrafica N:1 Settore (facoltativo, ADR059)
Anagrafica.belongsTo(Settore, { foreignKey: 'idSettore', as: 'settore' });
Settore.hasMany(Anagrafica, { foreignKey: 'idSettore', as: 'anagrafiche' });

export { Reparto, Operatore, Anagrafica, Settore };
