'use client'
import { useEffect, useState } from 'react'

const themes = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'green', label: 'Green' },
  { id: 'retro', label: 'Retro' },
] as const

export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')

  useEffect(() => {
    setMounted(true)
    const theme = document.documentElement.getAttribute('data-theme') || 'light'
    setCurrentTheme(theme)
  }, [])

  const handleThemeChange = (newTheme: string) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('app-theme', newTheme)
    setCurrentTheme(newTheme)
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }))
  }

  const Pill = (
    <div className={`inline-flex items-center gap-3 rounded-full bg-secondary p-1 border border-border shadow-sm ${className}`}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => handleThemeChange(t.id)}
          data-active={currentTheme === t.id}
          className="inline-flex items-center justify-center h-8 px-3 min-w-[72px] rounded-full text-sm font-medium leading-none whitespace-nowrap text-secondary-foreground transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  if (!mounted) return Pill
  return Pill
}