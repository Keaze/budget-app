const isDev = import.meta.env.DEV

export const logger = {
  info:  (...args) => isDev && console.info('[INFO]',  ...args),
  warn:  (...args) => isDev && console.warn('[WARN]',  ...args),
  error: (...args) =>          console.error('[ERROR]', ...args),
}
