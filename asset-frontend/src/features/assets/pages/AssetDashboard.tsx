// =============================================================================
// ASSET MODULE — PAGE: AssetDashboard
// features/assets/pages/AssetDashboard.tsx
// =============================================================================
//
// Pagina d'ingresso del modulo Asset. Volutamente vuota: serve solo a rendere
// il modulo navigabile. Mantenere `PageHeader` come intestazione quando si
// aggiunge il contenuto, così il layout resta coerente con le altre sezioni.
//

import React from 'react';
import { PageHeader } from '@/core/components/layout';

export const AssetDashboard: React.FC = () => {
  return (
    <div className='space-y-6'>
      <PageHeader title='Asset' />
    </div>
  );
};

export default AssetDashboard;
