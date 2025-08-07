/**
 * Theme Contrast Validation Script
 * Validates WCAG AA compliance for all themes
 */

import { validateThemeContrast, logContrastResults } from './contrast-checker';

// Theme color definitions (extracted from design-tokens.css)
const themes = {
  light: {
    'dt-background': '#f8fafc',
    'dt-foreground': '#0f172a',
    'dt-card': '#e2e8f0',
    'dt-card-foreground': '#0f172a',
    'dt-primary': '#7c3aed',
    'dt-primary-foreground': '#f8fafc',
    'dt-secondary': '#cbd5e1',
    'dt-secondary-foreground': '#0f172a',
    'dt-muted': '#e2e8f0',
    'dt-muted-foreground': '#475569',
    'dt-accent': '#6d28d9',
    'dt-accent-foreground': '#f8fafc',
    'dt-destructive': '#dc2626',
    'dt-destructive-foreground': '#f8fafc',
  },
  dark: {
    'dt-background': '#0a0a0a',
    'dt-foreground': '#fafafa',
    'dt-card': '#1a1a1a',
    'dt-card-foreground': '#fafafa',
    'dt-primary': '#fafafa',
    'dt-primary-foreground': '#0a0a0a',
    'dt-secondary': '#262626',
    'dt-secondary-foreground': '#fafafa',
    'dt-muted': '#262626',
    'dt-muted-foreground': '#a1a1aa',
    'dt-accent': '#262626',
    'dt-accent-foreground': '#fafafa',
    'dt-destructive': '#dc2626',
    'dt-destructive-foreground': '#fafafa',
  },
  green: {
    'dt-background': '#f0fdf4',
    'dt-foreground': '#14532d',
    'dt-card': '#dcfce7',
    'dt-card-foreground': '#14532d',
    'dt-primary': '#15803d',
    'dt-primary-foreground': '#f0fdf4',
    'dt-secondary': '#bbf7d0',
    'dt-secondary-foreground': '#14532d',
    'dt-muted': '#dcfce7',
    'dt-muted-foreground': '#15803d',
    'dt-accent': '#15803d',
    'dt-accent-foreground': '#f0fdf4',
    'dt-destructive': '#dc2626',
    'dt-destructive-foreground': '#f0fdf4',
  },
  retro: {
    'dt-background': '#fef3c7',
    'dt-foreground': '#451a03',
    'dt-card': '#fde68a',
    'dt-card-foreground': '#451a03',
    'dt-primary': '#92400e',
    'dt-primary-foreground': '#fef3c7',
    'dt-secondary': '#fed7aa',
    'dt-secondary-foreground': '#451a03',
    'dt-muted': '#fde68a',
    'dt-muted-foreground': '#92400e',
    'dt-accent': '#92400e',
    'dt-accent-foreground': '#fef3c7',
    'dt-destructive': '#b91c1c',
    'dt-destructive-foreground': '#fef3c7',
  },
};

/**
 * Validate all themes and log results
 */
export function validateAllThemes(): void {
  console.log('🎨 Starting theme contrast validation...\n');
  
  let totalFailures = 0;
  
  Object.entries(themes).forEach(([themeName, themeColors]) => {
    const results = validateThemeContrast(themeColors);
    logContrastResults(themeName, results);
    
    const failures = results.filter(r => !r.meetsAA).length;
    totalFailures += failures;
    
    console.log(''); // Add spacing between themes
  });
  
  console.log('📊 Validation Summary:');
  if (totalFailures === 0) {
    console.log('✅ All themes pass WCAG AA contrast requirements!');
  } else {
    console.warn(`⚠️ Found ${totalFailures} contrast issues across all themes`);
    console.log('💡 Consider adjusting colors to improve accessibility');
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateAllThemes();
}