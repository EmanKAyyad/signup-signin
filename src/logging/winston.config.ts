import { WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export function createWinstonConfig(): WinstonModuleOptions {
  const logDir = process.env.LOG_DIR || 'logs';
  const logLevel =
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

  const jsonFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  );

  return {
    level: logLevel,
    transports: [
      new DailyRotateFile({
        filename: `${logDir}/app-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES_COMBINED || '14d',
        zippedArchive: true,
        format: jsonFormat,
      }),
      new DailyRotateFile({
        level: 'error',
        filename: `${logDir}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES_ERROR || '30d',
        zippedArchive: true,
        format: jsonFormat,
      }),
      ...(process.env.NODE_ENV !== 'production'
        ? [
            new transports.Console({
              format: format.combine(
                format.colorize(),
                format.timestamp({ format: 'HH:mm:ss' }),
                format.printf(({ level, message, context, timestamp }) => {
                  const ctx = context ? `[${context}] ` : '';
                  return `${timestamp} ${ctx}${level}: ${message}`;
                }),
              ),
            }),
          ]
        : []),
    ],
  };
}
