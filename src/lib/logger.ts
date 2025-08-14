const isDev = process.env.NODE_ENV !== 'production'

export const log = {
  error: (...args: unknown[]) => { if (isDev) console.error('[app:error]', ...args) },
  warn:  (...args: unknown[]) => { if (isDev) console.warn('[app:warn]', ...args) },
  info:  (...args: unknown[]) => { if (isDev) console.info('[app:info]', ...args) },
  debug: (...args: unknown[]) => { if (isDev) console.debug('[app:debug]', ...args) },
}

// Mantener compatibilidad con el logger anterior
export const logger = log
export default log