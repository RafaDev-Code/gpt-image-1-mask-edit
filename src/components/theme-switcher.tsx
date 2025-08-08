'use client'
import { useTheme } from './theme-provider'

const themes = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'green', label: 'Green' },
  { id: 'retro', label: 'Retro' },
] as const

export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={`inline-flex items-center gap-3 rounded-full bg-secondary p-1 border border-border shadow-sm ${className}`}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id as any)}
          data-active={theme === t.id}
          className="inline-flex items-center justify-center h-8 px-3 min-w-[72px] rounded-full text-sm font-medium leading-none whitespace-nowrap text-secondary-foreground transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}