/**
 * Sistema de logging condicional
 * Solo muestra logs en desarrollo para evitar ruido en producción
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log de información general (solo en desarrollo)
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log de advertencias (siempre visible)
   */
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },

  /**
   * Log de errores (siempre visible)
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Log de debug detallado (solo en desarrollo, con flag adicional)
   */
  debug: (enabled: boolean, ...args: unknown[]): void => {
    if (isDevelopment && enabled) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log de información importante (siempre visible)
   */
  info: (...args: unknown[]): void => {
    console.info(...args);
  }
};
