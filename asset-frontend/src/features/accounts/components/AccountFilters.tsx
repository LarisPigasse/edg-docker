// src/features/accounts/pages/components/AccountFilters.tsx

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button, Badge } from '@/core/components/ui';
import type { AccountFilters as AccountFiltersType, AccountType, AccountStatus, Role } from '../types';

interface AccountFiltersProps {
  currentFilters: AccountFiltersType;
  roles: Role[];
  onApply: (filters: AccountFiltersType) => void;
}

const ACCOUNT_TYPES = [
  { value: 'operatore', label: 'Operatore' },
  { value: 'partner', label: 'Partner' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'agente', label: 'Agente' },
];

const STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: 'active', label: 'Attivo' },
  { value: 'inactive', label: 'Disattivato' },
  { value: 'blocked', label: 'Bloccato' },
];

export const AccountFilters: React.FC<AccountFiltersProps> = ({ currentFilters, roles, onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<AccountFiltersType>(currentFilters);

  const activeCount = Object.values(currentFilters).filter(v => v !== undefined && v !== '').length;

  const handleApply = () => {
    // Rimuove le chiavi con stringa vuota prima di applicare
    const cleaned = Object.fromEntries(
      Object.entries(draft).filter(([, v]) => v !== undefined && v !== '')
    ) as AccountFiltersType;
    onApply(cleaned);
    setIsOpen(false);
  };

  const handleReset = () => {
    const empty: AccountFiltersType = {};
    setDraft(empty);
    onApply(empty);
  };

  const handleOpen = () => {
    setDraft(currentFilters); // sincronizza il draft con i filtri correnti all'apertura
    setIsOpen(true);
  };

  const selectClass =
    'w-full px-3 py-2 bg-bg-primary text-text-primary border border-border-default ' +
    'rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm';

  const inputClass =
    'w-full px-3 py-2 bg-bg-primary text-text-primary border border-border-default ' +
    'rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm ' +
    'placeholder:text-text-placeholder';

  return (
    <div className='relative mb-6'>
      {/* ── Trigger button ── */}
      <Button variant='outline' size='md' leftIcon={<Filter className='w-4 h-4' />} onClick={handleOpen}>
        Filtri
        {activeCount > 0 && (
          <Badge variant='info' size='xs' className='ml-2'>
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* ── Dropdown panel ── */}
      {isOpen && (
        <>
          {/* Overlay per chiudere cliccando fuori */}
          <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />

          <div className='absolute top-full left-0 mt-2 w-80 bg-bg-primary rounded-lg shadow-themed-lg border border-border-default z-50'>
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-border-default'>
              <h3 className='text-section-title text-base'>Filtri</h3>
              <button
                onClick={() => setIsOpen(false)}
                className='p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors'
                aria-label='Chiudi filtri'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Campi filtro */}
            <div className='p-4 space-y-4 max-h-96 overflow-y-auto'>
              {/* Ricerca email */}
              <div>
                <label className='text-label block mb-1.5'>Email</label>
                <input
                  type='text'
                  placeholder='Cerca per email…'
                  value={draft.search || ''}
                  onChange={e => setDraft({ ...draft, search: e.target.value || undefined })}
                  className={inputClass}
                />
              </div>

              {/* Ruolo */}
              <div>
                <label className='text-label block mb-1.5'>Ruolo</label>
                <select
                  value={draft.roleId ?? ''}
                  onChange={e => setDraft({ ...draft, roleId: e.target.value ? Number(e.target.value) : undefined })}
                  className={selectClass}
                >
                  <option value=''>Tutti i ruoli</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo account */}
              <div>
                <label className='text-label block mb-1.5'>Tipo account</label>
                <select
                  value={draft.accountType || ''}
                  onChange={e => setDraft({ ...draft, accountType: (e.target.value as AccountType) || undefined })}
                  className={selectClass}
                >
                  <option value=''>Tutti i tipi</option>
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stato */}
              <div>
                <label className='text-label block mb-1.5'>Stato</label>
                <select
                  value={draft.status || ''}
                  onChange={e => setDraft({ ...draft, status: (e.target.value as AccountStatus) || undefined })}
                  className={selectClass}
                >
                  <option value=''>Tutti gli stati</option>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className='flex items-center justify-end gap-2 p-4 border-t border-border-default'>
              <Button variant='ghost' size='sm' onClick={handleReset}>
                Reset
              </Button>
              <Button variant='primary' size='sm' onClick={handleApply}>
                Applica
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountFilters;
