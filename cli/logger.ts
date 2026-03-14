// Silent logger that writes to stderr for diagnostics so stdout remains clean JSON
export const silentLogger = {
  debug: (...args: any[]) => console.error('[debug]', ...args),
  info: (...args: any[]) => console.error('[info]', ...args),
  warn: (...args: any[]) => console.error('[warn]', ...args),
  error: (...args: any[]) => console.error('[error]', ...args),
};
