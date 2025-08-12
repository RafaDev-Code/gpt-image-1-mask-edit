/**
 * WCAG 2.1 Contrast Checker Utility
 * Calculates contrast ratios and validates AA compliance
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function checkContrast(foreground: string, background: string): number {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    console.warn('Invalid color format. Expected hex colors.');
    return 1;
  }

  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsAAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Validate contrast for a theme's color tokens
 */
export interface ContrastResult {
  tokenPair: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  warning?: string;
}

export function validateThemeContrast(theme: Record<string, string>): ContrastResult[] {
  const results: ContrastResult[] = [];

  // Define critical color pairs to check
  const colorPairs = [
    { fg: 'dt-foreground', bg: 'dt-background', name: 'foreground/background' },
    { fg: 'dt-primary-foreground', bg: 'dt-primary', name: 'primary-foreground/primary' },
    { fg: 'dt-card-foreground', bg: 'dt-card', name: 'card-foreground/card' },
    { fg: 'dt-muted-foreground', bg: 'dt-muted', name: 'muted-foreground/muted' },
    { fg: 'dt-secondary-foreground', bg: 'dt-secondary', name: 'secondary-foreground/secondary' },
    { fg: 'dt-accent-foreground', bg: 'dt-accent', name: 'accent-foreground/accent' },
    { fg: 'dt-destructive-foreground', bg: 'dt-destructive', name: 'destructive-foreground/destructive' },
  ];

  colorPairs.forEach(({ fg, bg, name }) => {
    const fgColor = theme[fg];
    const bgColor = theme[bg];

    if (fgColor && bgColor) {
      const ratio = checkContrast(fgColor, bgColor);
      const aaCompliant = meetsAA(ratio);
      const aaaCompliant = meetsAAA(ratio);

      const result: ContrastResult = {
        tokenPair: name,
        ratio: Math.round(ratio * 100) / 100,
        meetsAA: aaCompliant,
        meetsAAA: aaaCompliant,
      };

      if (!aaCompliant) {
        result.warning = `Low contrast ratio (${result.ratio}:1). WCAG AA requires 4.5:1 minimum.`;
      }

      results.push(result);
    }
  });

  return results;
}

/**
 * Validate color palette contrast (primary and accent pairs)
 * Specifically for the new color system
 */
export function validateColorPalette(palette: string, colors: Record<string, string>): ContrastResult[] {
  const results: ContrastResult[] = [];

  // Define critical color pairs for palettes
  const colorPairs = [
    { fg: 'dt-primary-foreground', bg: 'dt-primary', name: 'primary-foreground/primary' },
    { fg: 'dt-accent-foreground', bg: 'dt-accent', name: 'accent-foreground/accent' },
  ];

  colorPairs.forEach(({ fg, bg, name }) => {
    const fgColor = colors[fg];
    const bgColor = colors[bg];

    if (fgColor && bgColor) {
      const ratio = checkContrast(fgColor, bgColor);
      const aaCompliant = meetsAA(ratio);
      const aaaCompliant = meetsAAA(ratio);

      const result: ContrastResult = {
        tokenPair: `${palette}/${name}`,
        ratio: Math.round(ratio * 100) / 100,
        meetsAA: aaCompliant,
        meetsAAA: aaaCompliant,
      };

      if (!aaCompliant) {
        result.warning = `Low contrast ratio (${result.ratio}:1) in ${palette} palette. WCAG AA requires 4.5:1 minimum.`;
      }

      results.push(result);
    }
  });

  return results;
}

/**
 * Log contrast validation results to console
 */
export function logContrastResults(themeName: string, results: ContrastResult[]): void {
  console.group(`🎨 Contrast validation for "${themeName}" theme`);
  
  results.forEach((result) => {
    // const icon = result.meetsAA ? '✅' : '❌';
    // const aaaIcon = result.meetsAAA ? ' (AAA ✅)' : '';
    
    // console.log(`${icon} ${result.tokenPair}: ${result.ratio}:1${aaaIcon}`);
    
    if (result.warning) {
      console.warn(`   ${result.warning}`);
    }
  });
  
  const failedCount = results.filter(r => !r.meetsAA).length;
  if (failedCount > 0) {
    console.warn(`⚠️ ${failedCount} color pairs do not meet WCAG AA standards`);
  } else {
    // console.log('✅ All color pairs meet WCAG AA standards');
  }
  
  console.groupEnd();
}