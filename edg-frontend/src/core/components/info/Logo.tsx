import React from 'react';
import { Link } from 'react-router-dom';
import { ThemedText, ThemedImage } from '../atomic';
import { APP_CONFIG } from '../../../config';

interface LogoProps {
  compact?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ compact = false, className = '' }) => {
  if (compact) {
    // Versione compatta - solo icona
    return (
      <Link to='/' className={`flex items-center text-2xl font-bold transition-colors ${className}`} title={APP_CONFIG.NAME}>
        {/* Logo immagine con fallback */}
        <ThemedImage
          imageKey='icon'
          alt='Icon logo'
          className='w-6 h-6 mr-2'
          onError={e => {
            // Nasconde l'immagine se non trovata
            e.currentTarget.style.display = 'none';
          }}
        />
      </Link>
    );
  }

  // Versione completa - icona + testo
  return (
    <Link to='/' className={`flex items-center text-2xl font-bold transition-colors ${className}`}>
      {/* Logo immagine con fallback */}

      <ThemedImage
        imageKey='icon'
        alt='Icon logo'
        className='w-6 h-6 mr-2'
        onError={e => {
          // Nasconde l'immagine se non trovata
          e.currentTarget.style.display = 'none';
        }}
      />
      {/* Testo del logo con colori branded - usando ThemedText per coerenza */}
      <span className='text-sky-500'>ed</span>
      <ThemedText variant='secondary' as='span'>
        g
      </ThemedText>
      <span className='text-sky-600 font-bold ms-0'>Tracking</span>
    </Link>
  );
};

export default Logo;
