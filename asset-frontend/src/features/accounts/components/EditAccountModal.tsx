// src/features/accounts/pages/components/EditAccountModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@/core/components/ui';
import { Alert } from '@/core/components/feedback';
import { Input, Select, Switch } from '@/core/components/form';
import { getErrorMessage } from '@/core/utils';
import type { Account, UpdateAccountRequest, AccountType, Role } from '../types';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accountId: number, data: UpdateAccountRequest) => Promise<void>;
  loading: boolean;
  account: Account | null;
  roles: Role[]; // ← dinamici
}

const accountTypeOptions: Array<{ value: AccountType; label: string }> = [
  { value: 'operatore', label: 'Operatore' },
  { value: 'partner', label: 'Partner' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'agente', label: 'Agente' },
];

const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, onConfirm, loading, account, roles }) => {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<number>(1);
  const [accountType, setAccountType] = useState<AccountType>('operatore');
  const [entityId, setEntityId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = roles.map(r => ({ value: r.id.toString(), label: r.name }));

  useEffect(() => {
    if (account) {
      setEmail(account.email);
      setRoleId(account.roleId);
      setAccountType(account.accountType);
      setEntityId(account.entityId || '');
      setIsActive(account.isActive);
      setError(null);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!account) return;
    if (!email) {
      setError('Email è obbligatoria');
      return;
    }
    try {
      await onConfirm(account.id, {
        email,
        roleId,
        accountType,
        entityId: entityId || undefined,
        isActive,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Errore durante l'aggiornamento dell'account"));
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const footer = (
    <div className='flex items-center justify-end space-x-3'>
      <Button variant='ghost' onClick={handleClose} disabled={loading}>
        Annulla
      </Button>
      <Button variant='primary' onClick={handleSubmit} isLoading={loading} loadingText='Salvataggio in corso...'>
        Salva Modifiche
      </Button>
    </div>
  );

  if (!account) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title='Modifica Account' size='md' footer={footer} preventClose={loading}>
      <div className='p-6'>
        {error && (
          <Alert variant='danger' className='mb-4'>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <Input label='Email' value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required fullWidth />
          <Select
            label='Ruolo'
            value={roleId.toString()}
            onValueChange={value => setRoleId(parseInt(value, 10))}
            options={roleOptions}
            disabled={loading || roleOptions.length === 0}
            required
            fullWidth
          />
          <Select
            label='Tipo Account'
            value={accountType}
            onValueChange={value => setAccountType(value as AccountType)}
            options={accountTypeOptions}
            disabled={loading}
            required
            fullWidth
          />
          <Input
            label='Entity ID'
            value={entityId}
            onChange={e => setEntityId(e.target.value)}
            disabled={loading}
            fullWidth
            helperText='UUID v4 entità associata (opzionale)'
          />
          <div className='pt-2'>
            <Switch label='Account Attivo' checked={isActive} onCheckedChange={setIsActive} disabled={loading} />
            <p className='text-sm text-gray-500 mt-1'>Disattivando l'account, l'utente non potrà più accedere al sistema.</p>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditAccountModal;
