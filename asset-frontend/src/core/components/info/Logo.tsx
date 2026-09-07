import React from 'react';
import { Link } from 'react-router-dom';
import { useThemedIcon } from '../../hooks/';
import { APP_CONFIG } from '../../../config';

interface LogoProps {
  compact?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ compact = false, className = '' }) => {
  const iconSrc = useThemedIcon();

  if (compact) {
    // Versione compatta - solo icona
    return (
      <Link to='/' className={`flex items-center text-2xl font-bold transition-colors ${className}`} title={APP_CONFIG.NAME}>
        <img
          src={iconSrc}
          alt='Icon logo'
          className='w-6 h-6 mr-2 transition-opacity duration-200'
          onError={e => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </Link>
    );
  }

  // Versione completa - icona + testo
  return (
    <Link to='/' className={`flex items-center text-2xl font-bold transition-colors ${className}`}>
      <img
        src={iconSrc}
        alt='Icon logo'
        className='w-6 h-6 mr-2 transition-opacity duration-200'
        onError={e => {
          e.currentTarget.style.display = 'none';
        }}
      />
      {/* Testo del logo con colori branded */}
      <span className='text-sky-500'>ed</span>
      <span className='text-text-secondary'>g</span>
      <span className='text-violet-600 font-bold ms-0'>Vigilo</span>
    </Link>
  );
};

export default Logo;
