// src/features/accounts/pages/components/CreateAccountModal.tsx

import React, { useState } from 'react';
import { Modal, Button } from '@/core/components/ui';
import { Alert } from '@/core/components/feedback';
import { Input, PasswordInput, Select } from '@/core/components/form';
import { getErrorMessage } from '@/core/utils';
import type { CreateAccountRequest, AccountType, Role } from '../types';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CreateAccountRequest) => Promise<void>;
  loading: boolean;
  roles: Role[]; // ← dinamici
}

const accountTypeOptions: Array<{ value: AccountType; label: string }> = [
  { value: 'operatore', label: 'Operatore' },
  { value: 'partner', label: 'Partner' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'agente', label: 'Agente' },
];

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose, onConfirm, loading, roles }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number>(roles[0]?.id ?? 1);
  const [accountType, setAccountType] = useState<AccountType>('operatore');
  const [entityId, setEntityId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const roleOptions = roles.map(r => ({ value: r.id.toString(), label: r.name }));

  const submittingRef = React.useRef(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setRoleId(roles[0]?.id ?? 1);
    setAccountType('operatore');
    setEntityId('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return; // ← blocca doppia chiamata
    submittingRef.current = true;
    setError(null);
    if (!email || !password) {
      setError('Email e password sono obbligatori');
      submittingRef.current = false;
      return;
    }
    try {
      await onConfirm({ email, password, roleId, accountType, entityId: entityId.trim() || undefined });
      resetForm();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Errore durante la creazione dell'account"));
    } finally {
      submittingRef.current = false;
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const footer = (
    <div className='flex items-center justify-end space-x-3'>
      <Button variant='ghost' onClick={handleClose} disabled={loading}>
        Annulla
      </Button>
      <Button variant='primary' onClick={handleSubmit} isLoading={loading} loadingText='Creazione in corso...'>
        Crea Account
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title='Crea Nuovo Account' size='md' footer={footer} preventClose={loading}>
      <div className='p-6'>
        {error && (
          <Alert variant='danger' className='mb-4'>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <Input
            label='Email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            required
            fullWidth
            autoComplete='off'
          />
          <PasswordInput
            label='Password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            required
            fullWidth
            autoComplete='new-password'
          />
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
            fullWidth
          />
          <Input
            label='Entity ID'
            value={entityId}
            onChange={e => setEntityId(e.target.value)}
            disabled={loading}
            fullWidth
            autoComplete='off'
            helperText='UUID v4 entità associata (es: e25c1ab3-f64f-44b3-be73-81d228b45d4d)'
          />
        </form>
      </div>
    </Modal>
  );
};

export default CreateAccountModal;
