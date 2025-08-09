/**
 * ESLint rule to prevent hardcoded colors in TypeScript/TSX files
 * Prohibits hex colors, rgb/hsl functions, and Tailwind color utilities
 * outside of src/styles/** directory
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded colors outside of style files',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      hexColor: 'Hardcoded hex color "{{color}}" is not allowed. Use design tokens instead.',
      rgbHslColor: 'Hardcoded {{type}} color is not allowed. Use design tokens instead.',
      tailwindColor: 'Hardcoded Tailwind color class "{{class}}" is not allowed. Use semantic tokens instead.',
    },
  },

  create(context) {
    const filename = context.getFilename();
    
    // Skip files in src/styles/ directory and validation utilities
    if (filename.includes('src\\styles\\') || filename.includes('src/styles/') ||
        filename.includes('validate-themes.ts') || 
        filename.includes('validate-color-palettes.ts') ||
        filename.includes('contrast-checker.ts')) {
      return {};
    }

    // Skip non-TS/TSX files
    if (!filename.endsWith('.ts') && !filename.endsWith('.tsx')) {
      return {};
    }

    const hexColorRegex = /#([0-9a-fA-F]{3,8})\b/g;
    const rgbHslRegex = /\b(rgb|hsl)a?\s*\(/g;
    const tailwindColorRegex = /\b(bg|text|border|ring|outline|decoration|divide|placeholder|caret|accent|shadow|from|via|to)-(red|green|blue|gray|yellow|purple|pink|indigo|orange|teal|cyan|lime|emerald|sky|violet|fuchsia|rose|amber|slate|zinc|neutral|stone)-(\d+)\b/g;

    function checkStringLiteral(node) {
      const value = node.value;
      
      // Check for hex colors
      let match;
      while ((match = hexColorRegex.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'hexColor',
          data: {
            color: match[0],
          },
        });
      }

      // Check for rgb/hsl colors
      hexColorRegex.lastIndex = 0; // Reset regex
      while ((match = rgbHslRegex.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'rgbHslColor',
          data: {
            type: match[1].toUpperCase(),
          },
        });
      }

      // Check for Tailwind color utilities
      rgbHslRegex.lastIndex = 0; // Reset regex
      while ((match = tailwindColorRegex.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'tailwindColor',
          data: {
            class: match[0],
          },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkStringLiteral(node);
        }
      },
      TemplateLiteral(node) {
        node.quasis.forEach(quasi => {
          if (quasi.value && quasi.value.raw) {
            // Create a mock node for reporting
            const mockNode = {
              ...quasi,
              value: quasi.value.raw,
            };
            checkStringLiteral(mockNode);
          }
        });
      },
    };
  },
};