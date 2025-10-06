/**
 * Logger utility for centralized, level-based logging
 *
 * Provides a simple, configurable logging system with different verbosity levels.
 * Allows silencing or setting verbosity for production vs. development environments.
 * All log methods accept any number of arguments which are passed through to console methods.
 *
 * @example
 * ```typescript
 * import { Logger } from '@/utils/logger';
 *
 * // Basic usage
 * Logger.warn('This is a warning message');
 * Logger.error('An error occurred:', error);
 *
 * // Configure logging level
 * Logger.setLevel('debug');  // Show all log levels
 * Logger.setLevel('error');  // Only show errors
 * Logger.setLevel('silent'); // Disable all logging
 *
 * // Performance timing
 * Logger.timeStart('operation');
 * // ... some operation ...
 * Logger.timeEnd('operation'); // Logs: "operation: 123.45ms"
 * ```
 *
 * @author @darianrosebrook
 */
export class Logger {
  /** Current logging level - messages below this level are filtered out */
  static level: "debug" | "info" | "warn" | "error" | "silent" = "warn";

  /**
   * Starts a performance timer for the given label
   *
   * @param label - A unique identifier for the timer
   *
   * @example
   * ```typescript
   * Logger.timeStart('api-call');
   * await fetch('/api/data');
   * Logger.timeEnd('api-call'); // Logs timing
   * ```
   */
  static timeStart(label: string): void {
    if (["debug", "info", "warn", "error"].includes(Logger.level))
      {console.time(label);}
  }

  /**
   * Ends a performance timer and logs the elapsed time
   *
   * @param label - The timer label to end (must match timeStart label)
   */
  static timeEnd(label: string): void {
    if (["debug", "info", "warn", "error"].includes(Logger.level))
      {console.timeEnd(label);}
  }

  /**
   * Logs a debug message (only visible when level is 'debug')
   *
   * @param args - Any number of arguments to log
   */
  static debug(...args: unknown[]): void {
    if (["debug"].includes(Logger.level)) {console.debug("[DEBUG]", ...args);}
  }

  /**
   * Logs an info message (visible when level is 'debug' or 'info')
   *
   * @param args - Any number of arguments to log
   */
  static info(...args: unknown[]): void {
    if (["debug", "info"].includes(Logger.level))
      {console.info("[INFO]", ...args);}
  }

  /**
   * Logs a warning message (visible when level is 'debug', 'info', or 'warn')
   *
   * @param args - Any number of arguments to log
   */
  static warn(...args: unknown[]): void {
    if (["debug", "info", "warn"].includes(Logger.level))
      {console.warn("[WARN]", ...args);}
  }

  /**
   * Logs an error message (visible when level is not 'silent')
   *
   * @param args - Any number of arguments to log
   */
  static error(...args: unknown[]): void {
    if (["debug", "info", "warn", "error"].includes(Logger.level))
      {console.error("[ERROR]", ...args);}
  }

  /**
   * Sets the current logging level
   *
   * @param level - The new logging level to set
   *
   * @example
   * ```typescript
   * Logger.setLevel('debug'); // Maximum verbosity
   * Logger.setLevel('warn');  // Default level
   * Logger.setLevel('error'); // Only errors
   * Logger.setLevel('silent'); // No logging
   * ```
   */
  static setLevel(level: typeof Logger.level): void {
    Logger.level = level;
  }
}
