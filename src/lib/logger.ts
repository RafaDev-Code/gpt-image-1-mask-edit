// =====================================================
// SISTEMA DE LOGGING UNIFICADO
// =====================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogContext {
  userId?: string;
  action?: string;
  component?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

// Type guard para errores
export function isError(err: unknown): err is { message?: string } {
  return typeof err === 'object' && err !== null && ('message' in err || err instanceof Error);
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(this.sanitizeContext(context))}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }
  
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    // Remover datos sensibles
    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'session',
      'email', 'phone', 'address', 'credit_card', 'ssn'
    ];
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debug(_message: string, _context?: LogContext): void {
    // Debug logging disabled for production cleanup
    // Original: console.debug(this.formatMessage('debug', message, context))
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(_message: string, _context?: LogContext): void {
    // Info logging disabled for production cleanup
    // Original: console.info(this.formatMessage('info', message, context))
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(_message: string, _context?: LogContext): void {
    // Warn logging disabled for production cleanup
    // Original: console.warn(this.formatMessage('warn', message, context))
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(_message: string, _context?: LogContext): void {
    // Error logging disabled for production cleanup
    // Original: console.error(this.formatMessage('error', message, context))
  }
  
  // Métodos específicos para eventos comunes
  auth(action: 'login' | 'logout' | 'signup' | 'error', userId?: string, details?: Record<string, unknown>): void {
    this.info(`Auth ${action}`, {
      action: `auth_${action}`,
      userId: userId || 'anonymous',
      component: 'auth',
      ...details
    });
  }
  
  theme(action: 'scheme_change' | 'color_change' | 'locale_change', userId?: string, details?: Record<string, unknown>): void {
    this.debug(`Theme ${action}`, {
      action: `theme_${action}`,
      userId: userId || 'anonymous',
      component: 'theme',
      ...details
    });
  }
  
  supabase(action: string, error?: unknown, context?: LogContext): void {
    if (error) {
      const errorMessage = isError(error) ? error.message : String(error);
      const errorCode = (error && typeof error === 'object' && 'code' in error) ? error.code : undefined;
      this.error(`Supabase ${action} failed`, {
        action: `supabase_${action}`,
        error: errorMessage || String(error),
        code: errorCode,
        component: 'supabase',
        ...context
      });
    } else {
      this.debug(`Supabase ${action} success`, {
        action: `supabase_${action}`,
        component: 'supabase',
        ...context
      });
    }
  }
}

// Instancia singleton
export const logger = new Logger();

// Exports para compatibilidad
export default logger;