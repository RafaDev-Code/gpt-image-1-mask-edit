'use client'

import { useEffect, useState } from 'react'

const themes = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'green', label: 'Green' },
  { id: 'retro', label: 'Retro' },
] as const

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')

  useEffect(() => {
    setMounted(true)
    // Leer tema actual del HTML
    const theme = document.documentElement.getAttribute('data-theme') || 'light'
    setCurrentTheme(theme)
  }, [])

  const handleThemeChange = (newTheme: string) => {
    // Cambiar tema directamente en el HTML
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('app-theme', newTheme)
    setCurrentTheme(newTheme)
    
    // Disparar evento personalizado para notificar al ThemeProvider
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }))
  }

  if (!mounted) {
    return (
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-3 rounded-full bg-secondary p-1 border border-border shadow-sm">
          <div className="inline-flex items-center justify-center h-8 px-3 min-w-[72px] rounded-full text-sm font-medium leading-none whitespace-nowrap bg-primary text-primary-foreground">
            Light
          </div>
          <div className="inline-flex items-center justify-center h-8 px-3 min-w-[72px] rounded-full text-sm font-medium leading-none whitespace-nowrap text-secondary-foreground opacity-60">
            Dark
          </div>
          <div className="inline-flex items-center justify-center h-8 px-3 min-w-[72px] rounded-full text-sm font-medium leading-none whitespace-nowrap text-secondary-foreground opacity-60">
            Green
          </div>
          <div className="inline-flex items-center justify-center h-8 px-3 min-w-[72px] rounded-full text-sm font-medium leading-none whitespace-nowrap text-secondary-foreground opacity-60">
            Retro
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex items-center gap-3 rounded-full bg-secondary p-1 border border-border shadow-sm">
        {themes.map((themeOption) => (
          <button
            key={themeOption.id}
            onClick={() => handleThemeChange(themeOption.id)}
            data-active={currentTheme === themeOption.id}
            className="inline-flex items-center justify-center h-8 px-3 min-w-[72px] rounded-full text-sm font-medium leading-none whitespace-nowrap text-secondary-foreground transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {themeOption.label}
          </button>
        ))}
      </div>
    </div>
  )
}