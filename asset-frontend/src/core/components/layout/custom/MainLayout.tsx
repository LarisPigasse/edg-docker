// src/core/components/layout/custom/MainLayout.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';

import { Header, Footer } from '..';
import { SettingsMenu, UserMenu } from '../../navigation';
import { useUISettings } from '../../../../app/hooks';
import { useIsMobile, useThemedImage } from '../../../hooks';
import { LAYOUT_CONFIG, isHomeActive } from '../../../../config';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Struttura di pagina condivisa: header, area centrale, footer.
 *
 * ─── Lo sfondo ──────────────────────────────────────────────────────────────
 * L'immagine è un `background-image` su due livelli `fixed inset-0`, non un
 * `<img>` nel flusso. Da qui tre conseguenze volute:
 *
 *  • copre l'intera finestra, quindi il padding del `<main>` (che serve al
 *    contenuto) non le lascia margini attorno;
 *  • non partecipa al calcolo dell'altezza del documento, quindi non può
 *    generare barre di scorrimento per quanto sia grande;
 *  • `bg-cover` la fa adattare a qualsiasi proporzione di finestra, ritagliando
 *    il minimo indispensabile e restando centrata.
 *
 * Sulla home l'immagine si vede piena. Sulle pagine interne le si sovrappone un
 * velo del colore di fondo, così il contenuto resta leggibile: colore, opacità
 * e z-index arrivano da `LAYOUT_CONFIG`, un punto solo da ritoccare.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { footerVisible } = useUISettings();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();

  const bgSrc = useThemedImage(LAYOUT_CONFIG.BACKGROUND_IMAGE);
  const isHome = isHomeActive(pathname);

  /** Immagine a tutta finestra + velo sulle pagine interne. */
  const background = (
    <>
      <div
        aria-hidden
        className='fixed inset-0 -z-20 bg-bg-base bg-cover bg-center bg-no-repeat'
        style={{ backgroundImage: `url(${bgSrc})` }}
      />
      {!isHome && (
        <div
          aria-hidden
          className={`fixed inset-0 ${LAYOUT_CONFIG.INNER_PAGE_BG_Z_INDEX} ${LAYOUT_CONFIG.INNER_PAGE_BG_COLOR} ${LAYOUT_CONFIG.INNER_PAGE_BG_OPACITY}`}
        />
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className='min-h-screen flex flex-col relative'>
        {background}

        <Header />

        <main className='flex-1'>
          <div className='w-full px-4 sm:px-6 py-8'>{children}</div>
        </main>

        {footerVisible && <Footer showVersionInfo={true} />}

        <SettingsMenu />
        <UserMenu />
      </div>
    );
  }

  return (
    <div className='min-h-full relative'>
      {background}

      <div className='grid grid-cols-1 grid-rows-[auto_1fr_auto] min-h-screen'>
        <header className='sticky top-0 z-40 col-span-full'>
          <Header />
        </header>

        {/* Nessun colore di sfondo qui: il `main` è trasparente e lascia
            vedere l'immagine. Il padding vale solo per il contenuto. */}
        <main className='min-w-0 flex flex-col px-6 py-6'>
          <div className='w-full flex-1'>{children}</div>
        </main>

        {footerVisible && (
          <footer className='sticky bottom-0 z-40 col-span-full'>
            <Footer showVersionInfo={true} />
          </footer>
        )}
      </div>

      <SettingsMenu />
      <UserMenu />
    </div>
  );
};

export default MainLayout;
