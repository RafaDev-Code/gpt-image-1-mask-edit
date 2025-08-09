'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, type Color } from '@/components/theme-provider';

const PALETTES: { id: Color; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'purple', label: 'Purple' },
  { id: 'blue', label: 'Blue' },
  { id: 'olive', label: 'Olive' },
  { id: 'tangerine', label: 'Tangerine' },
];

export function ColorSwitcher() {
  const { color, setColor } = useTheme();

  // Get current palette info
  const currentPalette = PALETTES.find(p => p.id === color) || PALETTES[0];

  return (
    <div className="shrink-0">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className="h-9 px-3 gap-2 leading-none transition-colors inline-flex items-center rounded-md border border-border bg-card text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Color theme"
        >
          {/* Dot del color actual usando tokens CSS */}
          <span 
            className="h-2.5 w-2.5 rounded-full" 
            style={{ backgroundColor: `var(--color-${currentPalette.id})` }} 
          />
          <span className="hidden sm:inline">{currentPalette.label}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={6}
          alignOffset={0}
          collisionPadding={8}
          avoidCollisions
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-50 min-w-[12rem] rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          <DropdownMenuRadioGroup value={color} onValueChange={setColor}>
            {PALETTES.map(palette => (
              <DropdownMenuRadioItem key={palette.id} value={palette.id} className="flex items-center gap-2">
                <span 
                  className="h-2.5 w-2.5 rounded-full" 
                  style={{ backgroundColor: `var(--color-${palette.id})` }} 
                />
                <span className="flex-1">{palette.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}