/**
 * Form modale per la creazione e modifica di una regola di alerting.
 * Gestisce sia il caso "nuova regola" (form vuoto) che "modifica" (form pre-popolato).
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Info } from 'lucide-react';
import Button from '@/core/components/ui/button/Button';
import { EventCategory, EventSeverity, ALERT_RULE_FORM_DEFAULTS } from '../types';
import type { AlertRule, AlertRuleFormData, EsitoType } from '../types';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Converte una regola esistente nei valori del form.
 */
const ruleToFormData = (rule: AlertRule): AlertRuleFormData => ({
  name: rule.name,
  description: rule.description ?? '',
  enabled: rule.enabled,
  conditions: {
    categoria: (rule.conditions.categoria ?? '') as EventCategory | '',
    sottoCategoria: rule.conditions.sottoCategoria ?? '',
    criticita: (rule.conditions.criticita ?? '') as EventSeverity | '',
    esito: (rule.conditions.esito ?? '') as EsitoType | '',
    origineId: rule.conditions.origineId ?? '',
  },
  threshold: {
    count: rule.threshold.count,
    windowMinutes: rule.threshold.windowMinutes,
  },
  cooldownMinutes: rule.cooldownMinutes,
});

// ============================================================================
// FORM FIELD ATOMS
// ============================================================================

const inputClass =
  'w-full text-sm border border-border-default rounded-md px-3 py-2 ' +
  'bg-bg-primary text-text-primary ' +
  'focus:outline-none focus:ring-2 focus:ring-violet-500 ' +
  'placeholder:text-text-secondary/60';

const labelClass = 'block text-xs font-medium text-text-secondary mb-1';

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, hint, children }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {children}
    {hint && (
      <p className='mt-1 text-xs text-text-secondary flex items-center gap-1'>
        <Info className='w-3 h-3 flex-shrink-0' />
        {hint}
      </p>
    )}
  </div>
);

// ============================================================================
// PROPS
// ============================================================================

interface AlertRuleFormProps {
  rule?: AlertRule | null; // null = nuova regola, AlertRule = modifica
  onSubmit: (data: AlertRuleFormData) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const AlertRuleForm: React.FC<AlertRuleFormProps> = ({ rule, onSubmit, onClose, loading }) => {
  const isEdit = !!rule;

  const [form, setForm] = useState<AlertRuleFormData>(rule ? ruleToFormData(rule) : { ...ALERT_RULE_FORM_DEFAULTS });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Se la regola cambia dall'esterno (es. apertura modifica diversa), aggiorna il form
  useEffect(() => {
    setForm(rule ? ruleToFormData(rule) : { ...ALERT_RULE_FORM_DEFAULTS });
    setErrors({});
  }, [rule]);

  // --------------------------------------------------------------------------
  // HELPERS UPDATE
  // --------------------------------------------------------------------------

  const setField = <K extends keyof AlertRuleFormData>(key: K, value: AlertRuleFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const setCondition = (key: keyof AlertRuleFormData['conditions'], value: string) =>
    setForm(prev => ({ ...prev, conditions: { ...prev.conditions, [key]: value } }));

  const setThreshold = (key: keyof AlertRuleFormData['threshold'], value: number) =>
    setForm(prev => ({ ...prev, threshold: { ...prev.threshold, [key]: value } }));

  // --------------------------------------------------------------------------
  // VALIDAZIONE
  // --------------------------------------------------------------------------

  const validate = (): boolean => {
    const e: Partial<Record<string, string>> = {};

    if (!form.name.trim()) {
      e.name = 'Il nome è obbligatorio';
    }

    if (form.threshold.count < 1) {
      e.count = 'Il conteggio deve essere almeno 1';
    }

    if (form.threshold.windowMinutes < 0) {
      e.windowMinutes = 'La finestra temporale non può essere negativa';
    }

    if (form.threshold.count > 1 && form.threshold.windowMinutes === 0) {
      e.windowMinutes = 'Specificare una finestra temporale per soglie > 1';
    }

    if (form.cooldownMinutes < 0) {
      e.cooldownMinutes = 'Il cooldown non può essere negativo';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // --------------------------------------------------------------------------
  // SUBMIT
  // --------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Overlay */}
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />

      {/* Modale */}
      <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-bg-primary shadow-2xl border border-border-default'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-border-default'>
          <h2 className='text-lg font-semibold text-text-primary'>{isEdit ? `Modifica regola` : 'Nuova regola di alerting'}</h2>
          <button
            onClick={onClose}
            className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='px-6 py-5 flex flex-col gap-5'>
          {/* --- SEZIONE: Identificazione --- */}
          <section className='flex flex-col gap-4'>
            <h3 className='text-sm font-semibold text-text-primary border-b border-border-default pb-2'>Identificazione</h3>

            <Field label='Nome *' hint='Deve essere univoco nel sistema'>
              <input
                type='text'
                className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder='Es. Errori critici auth-service'
                maxLength={100}
              />
              {errors.name && <p className='mt-1 text-xs text-red-500'>{errors.name}</p>}
            </Field>

            <Field label='Descrizione'>
              <textarea
                className={inputClass}
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder='Descrizione opzionale dello scopo della regola'
                rows={2}
                maxLength={300}
              />
            </Field>

            {/* Toggle enabled */}
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-text-secondary'>Regola abilitata</p>
                <p className='text-xs text-text-secondary opacity-70 mt-0.5'>Le regole disabilitate non generano alert</p>
              </div>
              <button
                type='button'
                onClick={() => setField('enabled', !form.enabled)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full
                  transition-colors duration-200 focus:outline-none focus:ring-2
                  focus:ring-offset-2 focus:ring-violet-500 cursor-pointer
                  ${form.enabled ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                  inline-block h-4 w-4 transform rounded-full bg-white shadow
                  transition-transform duration-200
                  ${form.enabled ? 'translate-x-6' : 'translate-x-1'}
                `}
                />
              </button>
            </div>
          </section>

          {/* --- SEZIONE: Condizioni --- */}
          <section className='flex flex-col gap-4'>
            <h3 className='text-sm font-semibold text-text-primary border-b border-border-default pb-2'>
              Condizioni
              <span className='ml-2 text-xs font-normal text-text-secondary'>(lasciare vuoto = qualsiasi valore)</span>
            </h3>

            <div className='grid grid-cols-2 gap-4'>
              <Field label='Categoria'>
                <select
                  className={inputClass}
                  value={form.conditions.categoria ?? ''}
                  onChange={e => setCondition('categoria', e.target.value)}
                >
                  <option value=''>Qualsiasi</option>
                  {Object.values(EventCategory).map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label='Criticità'>
                <select
                  className={inputClass}
                  value={form.conditions.criticita ?? ''}
                  onChange={e => setCondition('criticita', e.target.value)}
                >
                  <option value=''>Qualsiasi</option>
                  <option value='critical'>CRITICAL</option>
                  <option value='error'>ERROR</option>
                  <option value='warning'>WARNING</option>
                  <option value='info'>INFO</option>
                </select>
              </Field>

              <Field label='Esito'>
                <select
                  className={inputClass}
                  value={form.conditions.esito ?? ''}
                  onChange={e => setCondition('esito', e.target.value)}
                >
                  <option value=''>Qualsiasi</option>
                  <option value='fallito'>Fallito</option>
                  <option value='successo'>Successo</option>
                  <option value='parziale'>Parziale</option>
                </select>
              </Field>

              <Field label='Tipo evento (sottoCategoria)' hint='Es. login_failed, startup'>
                <input
                  type='text'
                  className={inputClass}
                  value={form.conditions.sottoCategoria ?? ''}
                  onChange={e => setCondition('sottoCategoria', e.target.value)}
                  placeholder='Qualsiasi'
                />
              </Field>
            </div>

            <Field label='ID Origine' hint='Filtra per un servizio o utente specifico'>
              <input
                type='text'
                className={inputClass}
                value={form.conditions.origineId ?? ''}
                onChange={e => setCondition('origineId', e.target.value)}
                placeholder='Qualsiasi'
              />
            </Field>
          </section>

          {/* --- SEZIONE: Soglia e cooldown --- */}
          <section className='flex flex-col gap-4'>
            <h3 className='text-sm font-semibold text-text-primary border-b border-border-default pb-2'>Soglia e cooldown</h3>

            <div className='grid grid-cols-3 gap-4'>
              <Field label='Conteggio eventi *' hint='1 = trigger immediato'>
                <input
                  type='number'
                  className={`${inputClass} ${errors.count ? 'border-red-500' : ''}`}
                  value={form.threshold.count}
                  min={1}
                  onChange={e => setThreshold('count', parseInt(e.target.value, 10) || 1)}
                />
                {errors.count && <p className='mt-1 text-xs text-red-500'>{errors.count}</p>}
              </Field>

              <Field label='Finestra (minuti)' hint='0 = nessuna finestra'>
                <input
                  type='number'
                  className={`${inputClass} ${errors.windowMinutes ? 'border-red-500' : ''}`}
                  value={form.threshold.windowMinutes}
                  min={0}
                  onChange={e => setThreshold('windowMinutes', parseInt(e.target.value, 10) || 0)}
                />
                {errors.windowMinutes && <p className='mt-1 text-xs text-red-500'>{errors.windowMinutes}</p>}
              </Field>

              <Field label='Cooldown (minuti)' hint='Silenzio dopo un trigger'>
                <input
                  type='number'
                  className={`${inputClass} ${errors.cooldownMinutes ? 'border-red-500' : ''}`}
                  value={form.cooldownMinutes}
                  min={0}
                  onChange={e => setField('cooldownMinutes', parseInt(e.target.value, 10) || 0)}
                />
                {errors.cooldownMinutes && <p className='mt-1 text-xs text-red-500'>{errors.cooldownMinutes}</p>}
              </Field>
            </div>

            {/* Anteprima configurazione soglia */}
            <div className='rounded-lg bg-bg-secondary border border-border-default px-4 py-3 text-xs text-text-secondary'>
              <span className='font-medium text-text-primary'>Comportamento: </span>
              {form.threshold.count === 1 && form.threshold.windowMinutes === 0
                ? 'Alert inviato immediatamente ad ogni evento che soddisfa le condizioni.'
                : `Alert inviato quando si verificano ${form.threshold.count} eventi in ${form.threshold.windowMinutes} minuti.`}
              {form.cooldownMinutes > 0 && <span> Successivi alert silenziati per {form.cooldownMinutes} minuti.</span>}
            </div>
          </section>

          {/* Footer */}
          <div className='flex items-center justify-end gap-3 pt-2 border-t border-border-default'>
            <Button variant='ghost' size='sm' onClick={onClose} type='button'>
              Annulla
            </Button>
            <Button variant='primary' size='sm' type='submit' disabled={loading}>
              <Save className='w-4 h-4 mr-1.5' />
              {loading ? 'Salvataggio...' : isEdit ? 'Salva modifiche' : 'Crea regola'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlertRuleForm;
