/**
 * Validate all color palettes for WCAG AA compliance
 */

import { validateColorPalette, logContrastResults, type ContrastResult } from './contrast-checker';

// Define all color palettes with their tokens
const colorPalettes = {
  default: {
    'dt-primary': '#2563EB',
    'dt-primary-foreground': '#FFFFFF',
    'dt-accent': '#1D4ED8',
    'dt-accent-foreground': '#FFFFFF',
  },
  purple: {
    'dt-primary': '#381D2A',
    'dt-primary-foreground': '#F8FAFC',
    'dt-accent': '#381D2A',
    'dt-accent-foreground': '#F8FAFC',
  },
  blue: {
    'dt-primary': '#2B4D6A',
    'dt-primary-foreground': '#F8FAFC',
    'dt-accent': '#1E40AF',
    'dt-accent-foreground': '#FFFFFF',
  },
  olive: {
    'dt-primary': '#5A7500',
    'dt-primary-foreground': '#FFFFFF',
    'dt-accent': '#AABD8C',
    'dt-accent-foreground': '#0F172A',
  },

  tangerine: {
    'dt-primary': '#D77E52',
    'dt-primary-foreground': '#0F172A',
    'dt-accent': '#F39B6D',
    'dt-accent-foreground': '#0F172A',
  },
};

/**
 * Validate all color palettes
 */
export function validateAllColorPalettes(): Record<string, ContrastResult[]> {
  const allResults: Record<string, ContrastResult[]> = {};

  Object.entries(colorPalettes).forEach(([paletteName, colors]) => {
    const results = validateColorPalette(paletteName, colors);
    allResults[paletteName] = results;
    logContrastResults(`${paletteName} palette`, results);
  });

  return allResults;
}

/**
 * Get summary of palette validation
 */
export function getPaletteValidationSummary(): {
  totalPalettes: number;
  compliantPalettes: number;
  failedPairs: ContrastResult[];
} {
  const allResults = validateAllColorPalettes();
  const failedPairs: ContrastResult[] = [];
  let compliantPalettes = 0;

  Object.entries(allResults).forEach(([, results]) => {
    const hasFailures = results.some(r => !r.meetsAA);
    if (!hasFailures) {
      compliantPalettes++;
    } else {
      failedPairs.push(...results.filter(r => !r.meetsAA));
    }
  });

  return {
    totalPalettes: Object.keys(colorPalettes).length,
    compliantPalettes,
    failedPairs,
  };
}

// Run validation if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  console.log('🎨 Validating all color palettes...');
  const summary = getPaletteValidationSummary();
  
  console.log('\n📊 Summary:');
  console.log(`✅ Compliant palettes: ${summary.compliantPalettes}/${summary.totalPalettes}`);
  
  if (summary.failedPairs.length > 0) {
    console.log(`⚠️ Failed pairs: ${summary.failedPairs.length}`);
    summary.failedPairs.forEach(pair => {
      console.log(`   - ${pair.tokenPair}: ${pair.ratio}:1`);
    });
  } else {
    console.log('🎉 All palettes meet WCAG AA standards!');
  }
}