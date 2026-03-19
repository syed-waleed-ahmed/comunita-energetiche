/**
 * Logger — Structured logging for Comunità Energetiche
 *
 * Provides a consistent, structured logging interface across the platform.
 * Logs are emitted as JSON in production for easy parsing by log aggregation
 * services (e.g., Datadog, ELK, CloudWatch). In development, logs are
 * human-readable with timestamps and color-coded levels.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, any>;
  error?: { name: string; message: string; stack?: string };
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const MIN_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'DEBUG';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }
  // Dev-friendly format
  const ts = entry.timestamp.split('T')[1]?.replace('Z', '') || entry.timestamp;
  const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  const err = entry.error ? ` | ${entry.error.name}: ${entry.error.message}` : '';
  return `[${ts}] ${entry.level.padEnd(5)} [${entry.module}] ${entry.message}${data}${err}`;
}

export function createLogger(module: string) {
  function log(level: LogLevel, message: string, data?: Record<string, any>, error?: Error) {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      ...(data && { data }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        },
      }),
    };

    const output = formatEntry(entry);

    switch (level) {
      case 'ERROR':
        console.error(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  return {
    debug: (msg: string, data?: Record<string, any>) => log('DEBUG', msg, data),
    info: (msg: string, data?: Record<string, any>) => log('INFO', msg, data),
    warn: (msg: string, data?: Record<string, any>, error?: Error) => log('WARN', msg, data, error),
    error: (msg: string, data?: Record<string, any>, error?: Error) => log('ERROR', msg, data, error),
  };
}
