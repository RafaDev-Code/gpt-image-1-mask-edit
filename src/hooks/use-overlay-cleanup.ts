import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook para limpiar overlays persistentes de Radix UI
 * que pueden quedar activos después de la navegación
 */
export function useOverlayCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    // Función para limpiar overlays persistentes
    const cleanupOverlays = () => {
      // Remover elementos de Radix UI que pueden quedar persistentes
      const radixElements = [
        '[data-radix-popper-content-wrapper]',
        '[data-radix-dialog-overlay]',
        '[data-radix-dropdown-menu-content]',
        '[data-radix-popover-content]',
        '.radix-portal'
      ];

      radixElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Solo remover si el elemento no tiene estado activo
          if (!element.hasAttribute('data-state') || 
              element.getAttribute('data-state') === 'closed') {
            element.remove();
          }
        });
      });

      // Limpiar estilos de body que pueden quedar aplicados
      document.body.style.removeProperty('pointer-events');
      document.body.style.removeProperty('overflow');
      
      // Remover clases de Radix que pueden bloquear interacciones
      document.body.classList.remove('radix-dialog-open', 'radix-dropdown-open');
    };

    // Ejecutar limpieza después de un pequeño delay para permitir animaciones
    const timeoutId = setTimeout(cleanupOverlays, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // Función manual para forzar limpieza
  const forceCleanup = () => {
    // Simular tecla Escape para cerrar cualquier overlay abierto
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(escapeEvent);

    // Limpiar después de un delay
    setTimeout(() => {
      const allOverlays = document.querySelectorAll('[data-radix-popper-content-wrapper], [data-radix-dialog-overlay]');
      allOverlays.forEach(overlay => overlay.remove());
    }, 50);
  };

  return { forceCleanup };
}