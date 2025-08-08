/* Registro de Temas - Fase 0: Metadatos preparados, sin activación */
/* Los temas adicionales se completarán en Fase 1 */

export type ThemeId = 'light' | 'dark' | 'green' | 'retro';

export interface ThemeMetadata {
  id: ThemeId;
  name: string;
  description: string;
  enabled: boolean; // Fase 0: solo 'light' habilitado
}

export const THEME_REGISTRY: Record<ThemeId, ThemeMetadata> = {
  light: {
    id: 'light',
    name: 'Light',
    description: 'Tema claro por defecto - Gris pálido con acentos violeta',
    enabled: true // Único tema activo en Fase 0
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Tema oscuro - Azul carbón con acentos violeta',
    enabled: false // TODO: Fase 1 - Activar tras completar variables
  },
  green: {
    id: 'green',
    name: 'Green',
    description: 'Tema verde - Paleta natural con acentos esmeralda',
    enabled: true // Habilitado para testing del bridge
  },
  retro: {
    id: 'retro',
    name: 'Retro',
    description: 'Tema retro - Paleta vintage con acentos cálidos',
    enabled: true // Habilitado para testing del bridge
  }
};

export function getEnabledThemes(): ThemeMetadata[] {
  return Object.values(THEME_REGISTRY).filter(theme => theme.enabled);
}

export function getThemeMetadata(themeId: ThemeId): ThemeMetadata | undefined {
  return THEME_REGISTRY[themeId];
}

export function isThemeEnabled(themeId: ThemeId): boolean {
  return THEME_REGISTRY[themeId]?.enabled ?? false;
}