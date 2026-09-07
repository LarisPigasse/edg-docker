// src/pages/Dashboard.tsx

import React from 'react';
import { APP_CONFIG } from '../config';

/**
 * HOME — pagina di default dopo il login.
 *
 * Mostra solo l'identità dell'applicazione, centrata sull'immagine di sfondo
 * del layout (vedi `MainLayout` e `LAYOUT_CONFIG.BACKGROUND_IMAGE`).
 *
 * Sul centraggio verticale: `h-full` funziona perché il contenitore del `main`
 * riceve la sua altezza dalla riga `1fr` della griglia di layout; `min-h-[50vh]`
 * è la rete di sicurezza per il ramo mobile, dove quell'altezza non è definita.
 * Restando sotto la metà della finestra non introduce barre di scorrimento.
 *
 * Nome e claim arrivano da `APP_CONFIG`: qui c'è solo la presentazione.
 */
const Dashboard: React.FC = () => {
  return (
    <div className='flex h-full min-h-[50vh] flex-col items-center justify-center px-4 text-center'>
      <h1 className='text-5xl font-bold tracking-tight text-text-link sm:text-6xl'>
        <span className='text-sky-500 text-4xl'>edg</span>
        {APP_CONFIG.NAME}
      </h1>

      {/* Filetto di accento nel colore primario del brand */}
      <span aria-hidden className='mt-5 block h-px w-72 bg-violet-500/70' />

      <p className='mt-5 max-w-xl text-xs text-text-primary'>{APP_CONFIG.TAGLINE}</p>
    </div>
  );
};

export default Dashboard;
