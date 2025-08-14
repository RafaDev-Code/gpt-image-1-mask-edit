const isDev = process.env.NODE_ENV !== 'production'

export const log = {
  error: (...args: any[]) => { if (isDev) console.error('[app:error]', ...args) },
  warn:  (...args: any[]) => { if (isDev) console.warn('[app:warn]', ...args) },
  info:  (...args: any[]) => { if (isDev) console.info('[app:info]', ...args) },
  debug: (...args: any[]) => { if (isDev) console.debug('[app:debug]', ...args) },
}

// Mantener compatibilidad con el logger anterior
export const logger = log
export default log