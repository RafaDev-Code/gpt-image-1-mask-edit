'use client'
import { useTheme } from './theme-provider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Palette, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const themes = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'green', label: 'Green' },
  { id: 'retro', label: 'Retro' },
] as const

export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <>
      {/* Pill version for screens >= 480px */}
      <div className={`hidden xs:inline-flex items-center gap-2 rounded-full bg-secondary p-1 border border-border shadow-sm max-w-full ${className}`}>
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id as any)}
            data-active={theme === t.id}
            className="inline-flex items-center justify-center h-8 px-3 min-w-[64px] rounded-full text-sm font-medium leading-none whitespace-nowrap text-secondary-foreground transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Dropdown version for screens <= 480px */}
      <div className={`inline-flex xs:hidden ${className}`}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-secondary text-secondary-foreground border border-border shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-haspopup="menu"
          >
            <Palette className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">{t('theme', 'Theme')}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {themes.map((themeOption) => (
              <DropdownMenuItem
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id as any)}
                className="flex items-center justify-between cursor-pointer"
                role="menuitem"
              >
                <span>{themeOption.label}</span>
                {theme === themeOption.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}