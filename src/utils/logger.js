import winston from 'winston';

const { createLogger, transports, format } = winston;

/**
 * Create a Winston logger instance.
 * No config stored — caller provides all options.
 *
 * Usage (in service server.js):
 *   const logger = core.utils.createAppLogger({
 *     level: process.env.LOG_LEVEL || 'info',
 *     service: 'user-service',
 *     pretty: process.env.LOG_PRETTY === 'true',
 *   });
 *
 * @param {Object}  opts
 *   level   {string}  Log level: error | warn | info | debug (default 'info')
 *   service {string}  Service name added to every log entry (default 'godhan-core')
 *   pretty  {boolean} Human-readable colorized output instead of JSON (default false)
 */
export function createAppLogger({
  level = 'info',
  service = 'godhan-core',
  pretty = false,
} = {}) {
  const shared = [
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
  ];

  const logFormat = pretty
    ? format.combine(
        format.colorize(),
        ...shared,
        format.printf((info) => {
          const msg = typeof info.message === 'string' ? info.message : JSON.stringify(info.message);
          const { timestamp, level, message, service: _s, stack, ...rest } = info;
          const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
          const stackStr = stack ? `\n${stack}` : '';
          return `[${timestamp}] [${service}] ${level}: ${msg}${extra}${stackStr}`;
        })
      )
    : format.combine(
        ...shared,
        format.json()
      );

  return createLogger({
    level,
    defaultMeta: { service },
    format: logFormat,
    transports: [
      new transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
  });
}

const logger = createAppLogger();

export default logger;
