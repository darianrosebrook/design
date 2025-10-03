/**
 * @fileoverview Observability utilities for canvas renderer
 * @author @darianrosebrook
 * 
 * Provides logging, metrics, and performance monitoring for the renderer.
 * Follows the observability requirements from DESIGNER-005 spec.
 */

/**
 * Log levels for renderer events
 */
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = "counter",
  GAUGE = "gauge",
  HISTOGRAM = "histogram",
}

/**
 * Metric entry structure
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: string;
}

/**
 * Performance trace span
 */
export interface TraceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Observability logger
 */
export class Logger {
  private enabled: boolean;
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Circular buffer

  constructor(
    enabled: boolean = true,
    minLevel: LogLevel = LogLevel.INFO
  ) {
    this.enabled = enabled;
    this.minLevel = minLevel;
  }

  /**
   * Log an error
   */
  error(category: string, message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, category, message, metadata);
  }

  /**
   * Log a warning
   */
  warn(category: string, message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, category, message, metadata);
  }

  /**
   * Log info
   */
  info(category: string, message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, category, message, metadata);
  }

  /**
   * Log debug
   */
  debug(category: string, message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, category, message, metadata);
  }

  /**
   * Log entry
   */
  private log(
    level: LogLevel,
    category: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.enabled) return;
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
    };

    // Add to circular buffer
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift();
    }
    this.logs.push(entry);

    // Console output in development
    if (process.env.NODE_ENV !== "production") {
      const style = this.getConsoleStyle(level);
      console[level](
        `%c[${category}] ${message}`,
        style,
        metadata || ""
      );
    }
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex <= currentIndex;
  }

  /**
   * Get console style for level
   */
  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return "color: #ef4444; font-weight: bold";
      case LogLevel.WARN:
        return "color: #f59e0b; font-weight: bold";
      case LogLevel.INFO:
        return "color: #3b82f6";
      case LogLevel.DEBUG:
        return "color: #6b7280";
      default:
        return "";
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private enabled: boolean;
  private metrics: Map<string, Metric> = new Map();

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Record a counter metric
   */
  counter(name: string, value: number = 1, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);

    this.metrics.set(key, {
      name,
      type: MetricType.COUNTER,
      value: existing ? existing.value + value : value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record a gauge metric
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    const key = this.getMetricKey(name, labels);
    this.metrics.set(key, {
      name,
      type: MetricType.GAUGE,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record a histogram metric
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    const key = this.getMetricKey(name, labels);
    this.metrics.set(key, {
      name,
      type: MetricType.HISTOGRAM,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get metric key with labels
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${name}{${labelStr}}`;
  }

  /**
   * Get all metrics
   */
  getMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific metric
   */
  getMetric(name: string, labels?: Record<string, string>): Metric | undefined {
    const key = this.getMetricKey(name, labels);
    return this.metrics.get(key);
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Performance tracer
 */
export class PerformanceTracer {
  private enabled: boolean;
  private activeSpans: Map<string, TraceSpan> = new Map();
  private completedSpans: TraceSpan[] = [];
  private maxSpans = 1000; // Circular buffer

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Start a trace span
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.activeSpans.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End a trace span
   */
  end(name: string): void {
    if (!this.enabled) return;

    const span = this.activeSpans.get(name);
    if (!span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;

    this.activeSpans.delete(name);

    // Add to circular buffer
    if (this.completedSpans.length >= this.maxSpans) {
      this.completedSpans.shift();
    }
    this.completedSpans.push(span);
  }

  /**
   * Measure a function execution
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) return fn();

    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get completed spans
   */
  getSpans(): TraceSpan[] {
    return [...this.completedSpans];
  }

  /**
   * Get active spans
   */
  getActiveSpans(): TraceSpan[] {
    return Array.from(this.activeSpans.values());
  }

  /**
   * Clear spans
   */
  clear(): void {
    this.activeSpans.clear();
    this.completedSpans = [];
  }
}

/**
 * Combined observability instance
 */
export class Observability {
  public logger: Logger;
  public metrics: MetricsCollector;
  public tracer: PerformanceTracer;

  constructor(enabled: boolean = true) {
    this.logger = new Logger(enabled);
    this.metrics = new MetricsCollector(enabled);
    this.tracer = new PerformanceTracer(enabled);
  }

  /**
   * Disable all observability
   */
  disable(): void {
    this.logger = new Logger(false);
    this.metrics = new MetricsCollector(false);
    this.tracer = new PerformanceTracer(false);
  }

  /**
   * Clear all observability data
   */
  clear(): void {
    this.logger.clear();
    this.metrics.clear();
    this.tracer.clear();
  }
}

/**
 * Create default observability instance
 */
export function createObservability(enabled: boolean = true): Observability {
  return new Observability(enabled);
}

