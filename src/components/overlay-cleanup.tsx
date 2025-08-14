'use client';

import { useOverlayCleanup } from '@/hooks/use-overlay-cleanup';

/**
 * Componente cliente para manejar la limpieza automática de overlays
 * Se debe incluir en el layout principal
 */
export function OverlayCleanup() {
  useOverlayCleanup();
  return null;
}