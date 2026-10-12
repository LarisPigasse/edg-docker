// =============================================================================
// Chi ha creato e modificato (02-modello-dati 2.1)
// =============================================================================
// Hook permanenti di Sequelize: su ogni modello con creatoDa/modificatoDa
// scrivono l'account della richiesta in corso (contesto, ADR039), senza
// passarlo a mano in ogni servizio. Nei processi pianificati non c'e' un
// account: restano null, cioe' "Vigilo".
// =============================================================================
import { Model, ModelStatic } from 'sequelize';
import { sequelize } from '../../config/database';
import { currentAccountId } from '../services/requestContext';

const ha = (istanza: Model, campo: string): boolean =>
  campo in (istanza.constructor as ModelStatic<Model>).getAttributes();

const allaCreazione = (istanza: Model, account: number): void => {
  if (ha(istanza, 'creatoDa') && istanza.get('creatoDa') == null) istanza.set('creatoDa', account);
  if (ha(istanza, 'modificatoDa')) istanza.set('modificatoDa', account);
};

export function installaAudit(): void {
  sequelize.addHook('beforeCreate', (istanza: Model) => {
    const account = currentAccountId();
    if (account !== undefined) allaCreazione(istanza, account);
  });

  sequelize.addHook('beforeBulkCreate', (istanze: Model[]) => {
    const account = currentAccountId();
    if (account !== undefined) istanze.forEach(istanza => allaCreazione(istanza, account));
  });

  sequelize.addHook('beforeUpdate', (istanza: Model) => {
    const account = currentAccountId();
    if (account !== undefined && ha(istanza, 'modificatoDa')) istanza.set('modificatoDa', account);
  });

  // Model.update(valori, { where }): i valori sono in options.attributes
  sequelize.addHook('beforeBulkUpdate', (options: any) => {
    const account = currentAccountId();
    if (account === undefined || !options.model?.getAttributes().modificatoDa) return;
    options.attributes.modificatoDa = account;
    if (Array.isArray(options.fields) && !options.fields.includes('modificatoDa')) options.fields.push('modificatoDa');
  });
}
