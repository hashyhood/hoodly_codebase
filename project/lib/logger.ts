/* Simple environment-aware logger.
 * In development, forwards to console.
 * In production, keeps errors and warnings; ignores debug/info to reduce noise.
 */

type LogArgs = [message?: any, ...optionalParams: any[]];

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
  debug: (...args: LogArgs) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  info: (...args: LogArgs) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },
  warn: (...args: LogArgs) => {
    // eslint-disable-next-line no-console
    console.warn(...args);
  },
  error: (...args: LogArgs) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  },
};

export type Logger = typeof logger;


