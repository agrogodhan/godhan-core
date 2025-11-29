import winston from 'winston';

const { createLogger, transports, format } = winston;

/**
 * Creates a logger instance.
 * 
 * @param {Object} opts
 *  - level: log level (info, debug, warn, error)
 *  - service: name of service using logger
 *  - json: enable JSON logs
 */
export function createAppLogger({
  level = 'info',           // default fallback
  service = 'godhan-core',  // default fallback
  json = true
} = {}) {
  const logFormat = json
    ? format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }),
        format.json()
      )
    : format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) => {
          const msg = typeof info.message === 'string' ? info.message : JSON.stringify(info.message);
          return `[${info.timestamp}] [${service}] ${info.level}: ${msg}`;
        })
      );

  return createLogger({
    level,
    defaultMeta: { service },
    format: logFormat,
    transports: [
      new transports.Console({
        handleExceptions: true
      })
    ]
  });
}

/**
 * Default logger instance used internally in core
 * When a service imports without arguments,
 * core logger will still work safely.
 */
const logger = createAppLogger();

export default logger;


