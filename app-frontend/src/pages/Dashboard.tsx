// src/features/shared/Dashboard.tsx
import React from 'react';
import { useAppSelector } from '../app/hooks';
import { ThemedSurface, ThemedText, ThemedShadow } from '../core/components/atomic';

const Dashboard: React.FC = () => {
  // Test che gli hook Redux funzionino
  const state = useAppSelector(state => state);
  console.log('Redux state:', state);

  return (
    <div className='space-y-8'>
      {/* Hero Section */}
      <div className='text-center'>
        <h1 className='text-4xl font-bold mb-4'>EDG APP</h1>
        <ThemedText variant='secondary' as='p' className='text-lg max-w-2xl mx-auto'>
          Applicazione Modulare dedicata ai Partner Express Delivery
        </ThemedText>
      </div>

      {/* Status Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <ThemedShadow variant='sm'>
          <ThemedSurface variant='primary' borderVariant='default' className='p-6 rounded-lg'>
            <div className='flex items-center'>
              <div className='w-3 h-3 bg-green-500 rounded-full mr-3'></div>
              <ThemedText variant='primary' className='font-semibold'>
                React + TypeScript
              </ThemedText>
            </div>
            <ThemedText variant='secondary' as='p' className='text-sm mt-2'>
              Stack tecnologico configurato
            </ThemedText>
          </ThemedSurface>
        </ThemedShadow>

        <ThemedShadow variant='sm'>
          <ThemedSurface variant='primary' borderVariant='default' className='p-6 rounded-lg'>
            <div className='flex items-center'>
              <div className='w-3 h-3 bg-green-500 rounded-full mr-3'></div>
              <ThemedText variant='primary' className='font-semibold'>
                Redux Toolkit
              </ThemedText>
            </div>
            <ThemedText variant='secondary' as='p' className='text-sm mt-2'>
              Redux configurato: {Object.keys(state).length > 0 ? 'Store attivo' : 'Store vuoto (OK)'}
            </ThemedText>
          </ThemedSurface>
        </ThemedShadow>

        <ThemedShadow variant='sm'>
          <ThemedSurface variant='primary' borderVariant='default' className='p-6 rounded-lg'>
            <div className='flex items-center'>
              <div className='w-3 h-3 bg-green-500 rounded-full mr-3'></div>
              <ThemedText variant='primary' className='font-semibold'>
                Tailwind CSS
              </ThemedText>
            </div>
            <ThemedText variant='secondary' as='p' className='text-sm mt-2'>
              Sistema di styling atomico attivo
            </ThemedText>
          </ThemedSurface>
        </ThemedShadow>
      </div>

      {/* Additional Info Section */}
      <ThemedShadow variant='default'>
        <ThemedSurface variant='info' borderVariant='default' className='p-6 rounded-lg'>
          <ThemedText variant='primary' className='font-semibold text-lg mb-3'>
            🚀 Template Features
          </ThemedText>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <ThemedText variant='primary' className='font-medium mb-2'>
                Componenti Atomici:
              </ThemedText>
              <ul className='space-y-1'>
                <ThemedText variant='secondary' as='li' className='text-sm'>
                  • ThemedSurface - Sfondi e contenitori
                </ThemedText>
                <ThemedText variant='secondary' as='li' className='text-sm'>
                  • ThemedText - Testi semantici
                </ThemedText>
                <ThemedText variant='secondary' as='li' className='text-sm'>
                  • ThemedBorder - Bordi tematici
                </ThemedText>
                <ThemedText variant='secondary' as='li' className='text-sm'>
                  • ThemedShadow - Ombre responsive
                </ThemedText>
              </ul>
            </div>
            <div>
              <ThemedText variant='primary' className='font-medium mb-2'>
                Sistema di Design:
              </ThemedText>
              <ul className='space-y-1'>
                <ThemedText variant='secondary' as='li' className='text-sm'>
                  • Light/Dark mode automatico
                </ThemedText>
                <ThemedText variant='secondary' as='li' className='text-sm'>
                  • Variabili CSS semantiche
                </ThemedText>
                <ThemedText variant='secondary' as='li' className='text-sm'>
                  • Icone Lucide React
                </ThemedText>
                <ThemedText variant='secondary' as='li' className='text-sm'>
                  • Layout responsivo
                </ThemedText>
              </ul>
            </div>
          </div>
        </ThemedSurface>
      </ThemedShadow>
    </div>
  );
};

export default Dashboard;
