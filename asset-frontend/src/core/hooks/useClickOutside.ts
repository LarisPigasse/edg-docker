// src/core/hooks/useClickOutside.ts
import { useEffect, type RefObject } from 'react';

/**
 * Hook per rilevare click al di fuori di uno o più elementi di riferimento.
 * Usa "mousedown" (non "click") apposta: intercetta l'interazione PRIMA che il
 * focus si sposti tra gli elementi, evitando race condition con eventi focus/blur.
 *
 * @param refs - Ref (o array di ref) degli elementi considerati "dentro"
 * @param handler - Callback invocata quando il click avviene fuori da tutti i ref
 * @param enabled - Se false, il listener resta disattivato (es. pannello già chiuso)
 */
export const useClickOutside = (
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled) return;

    const refList = Array.isArray(refs) ? refs : [refs];

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInside = refList.some(ref => ref.current?.contains(target));
      if (!isInside) handler();
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- i ref restano stabili tra i render, solo il wrapper array cambia identità
  }, [handler, enabled]);
};

export default useClickOutside;
