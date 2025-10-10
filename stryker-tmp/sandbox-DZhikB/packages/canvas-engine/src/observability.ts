/**
 * @fileoverview Observability and telemetry for canvas engine operations
 * @author @darianrosebrook
 */

import type { CanvasDocumentType } from "@paths-design/canvas-schema";

/**
 * Operation types for telemetry
 */
export type OperationType =
  | "createNode"
  | "updateNode"
  | "deleteNode"
  | "moveNode"
  | "findNodeById"
  | "traverseDocument"
  | "hitTest"
  | "applyPatch"
  | "applyPatches";

/**
 * Log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Metrics data structure
 */
interface MetricsData {
  operations_total: Record<OperationType, number>;
  operation_duration_ms: Record<OperationType, number[]>;
  document_nodes_total: number;
  last_updated: number;
}

/**
 * Trace span for distributed tracing
 */
interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  parentId?: string;
  attributes: Record<string, any>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
  }>;
}

/**
 * Observability configuration
 */
export interface ObservabilityConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  enableTracing?: boolean;
  logLevel?: LogLevel;
  serviceName?: string;
  serviceVersion?: string;
}

/**
 * Default configuration
 */
const defaultConfig: ObservabilityConfig = {
  enableLogging: true,
  enableMetrics: true,
  enableTracing: false, // Disabled by default for performance
  logLevel: "info",
  serviceName: "canvas-engine",
  serviceVersion: "0.1.0",
};

/**
 * Global observability state
 */
class ObservabilityManager {
  private config: ObservabilityConfig;
  private metrics: MetricsData;
  private activeSpans: Map<string, TraceSpan> = new Map();
  private rootSpanId?: string;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.metrics = {
      operations_total: {} as Record<OperationType, number>,
      operation_duration_ms: {} as Record<OperationType, number[]>,
      document_nodes_total: 0,
      last_updated: Date.now(),
    };

    // Initialize operation counters
    const operationTypes: OperationType[] = [
      "createNode",
      "updateNode",
      "deleteNode",
      "moveNode",
      "findNodeById",
      "traverseDocument",
      "hitTest",
      "applyPatch",
      "applyPatches",
    ];
    operationTypes.forEach((type) => {
      this.metrics.operations_total[type] = 0;
      this.metrics.operation_duration_ms[type] = [];
    });
  }

  /**
   * Start a new trace span
   */
  startSpan(
    name: string,
    parentId?: string,
    attributes: Record<string, any> = {}
  ): string {
    if (!this.config.enableTracing) {
      return "";
    }

    const spanId = this.generateSpanId();
    const span: TraceSpan = {
      id: spanId,
      name,
      startTime: Date.now(),
      parentId,
      attributes,
      events: [],
    };

    this.activeSpans.set(spanId, span);

    if (!parentId && !this.rootSpanId) {
      this.rootSpanId = spanId;
    }

    return spanId;
  }

  /**
   * End a trace span
   */
  endSpan(spanId: string): void {
    if (!this.config.enableTracing || !this.activeSpans.has(spanId)) {
      return;
    }

    const span = this.activeSpans.get(spanId);
    if (!span) {
      console.warn(`Span ${spanId} not found`);
      return;
    }
    span.endTime = Date.now();
    this.activeSpans.delete(spanId);

    if (spanId === this.rootSpanId) {
      this.rootSpanId = undefined;
    }
  }

  /**
   * Add an event to a trace span
   */
  addSpanEvent(
    spanId: string,
    name: string,
    attributes?: Record<string, any>
  ): void {
    if (!this.config.enableTracing || !this.activeSpans.has(spanId)) {
      return;
    }

    const span = this.activeSpans.get(spanId);
    if (!span) {
      console.warn(`Span ${spanId} not found in addSpanEvent`);
      return;
    }
    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  /**
   * Log a structured message
   */
  log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.config.enableLogging || !this.shouldLog(level)) {
      return;
    }

    const logEntry = {
      timestamp: Date.now(),
      level,
      service: this.config.serviceName,
      version: this.config.serviceVersion,
      message,
      context,
    };

    // Use structured logging format
    const output = JSON.stringify(logEntry);

    switch (level) {
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(output);
        break;
      case "info":
        console.info(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
        console.error(output);
        break;
    }
  }

  /**
   * Record operation metrics
   */
  recordOperation(
    type: OperationType,
    durationMs: number,
    nodeCount?: number
  ): void {
    if (!this.config.enableMetrics) {
      return;
    }

    // Increment counter
    this.metrics.operations_total[type]++;

    // Record duration histogram (keep last 100 samples)
    if (!this.metrics.operation_duration_ms[type]) {
      this.metrics.operation_duration_ms[type] = [];
    }

    const durations = this.metrics.operation_duration_ms[type];
    durations.push(durationMs);

    if (durations.length > 100) {
      durations.shift();
    }

    // Update document metrics if provided
    if (nodeCount !== undefined) {
      this.metrics.document_nodes_total = nodeCount;
    }

    this.metrics.last_updated = Date.now();
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): Readonly<MetricsData> {
    return { ...this.metrics };
  }

  /**
   * Export traces for debugging
   */
  exportTraces(): Array<TraceSpan & { duration?: number }> {
    const traces = Array.from(this.activeSpans.values());

    // Calculate durations for completed spans
    return traces.map((span) => ({
      ...span,
      duration: span.endTime
        ? span.endTime - span.startTime
        : Date.now() - span.startTime,
    }));
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevel = levels.indexOf(this.config.logLevel || "info");
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevel;
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Global observability instance
 */
export const observability = new ObservabilityManager();

/**
 * Operation context for observability
 */
export interface OperationContext {
  spanId?: string;
  operationType: OperationType;
  documentId?: string;
  nodeId?: string;
  nodeCount?: number;
}

/**
 * Create an operation context
 */
export function createOperationContext(
  operationType: OperationType,
  document?: CanvasDocumentType,
  nodeId?: string,
  additionalContext?: Record<string, any>
): OperationContext {
  return {
    operationType,
    documentId: document?.id,
    nodeId,
    nodeCount: document
      ? observability.getMetrics().document_nodes_total
      : undefined,
    ...additionalContext,
  };
}

/**
 * Decorator for instrumenting operations
 */
export function instrumented<T extends any[], R>(
  operationType: OperationType,
  contextExtractor?: (...args: T) => Record<string, any>
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => R>
  ) {
    const method = descriptor.value!;

    descriptor.value = function (...args: T): R {
      const context = contextExtractor
        ? contextExtractor.apply(this, args)
        : {};
      // For now, assume first arg is document if it's an object, second is nodeId if string
      const document =
        typeof args[0] === "object" && args[0] !== null
          ? (args[0] as CanvasDocumentType)
          : undefined;
      const nodeId = typeof args[1] === "string" ? args[1] : undefined;
      const operationContext = createOperationContext(
        operationType,
        document,
        nodeId,
        context
      );

      // Start tracing span
      const spanId = observability.startSpan(
        `${operationType}.${propertyName}`,
        undefined,
        operationContext
      );

      // Log operation start
      observability.log("info", `engine.operation.start`, {
        operation: operationType,
        function: propertyName,
        context: operationContext,
      });

      const startTime = performance.now();

      try {
        // Execute the operation
        const result = method.apply(this, args);

        // Record success metrics and logs
        const duration = performance.now() - startTime;
        observability.recordOperation(
          operationType,
          duration,
          operationContext.nodeCount
        );

        observability.log("info", `engine.operation.complete`, {
          operation: operationType,
          function: propertyName,
          duration_ms: Math.round(duration),
          context: operationContext,
        });

        // End tracing span
        observability.endSpan(spanId);

        return result;
      } catch (error) {
        // Record error metrics and logs
        const duration = performance.now() - startTime;
        observability.recordOperation(
          operationType,
          duration,
          operationContext.nodeCount
        );

        observability.log("error", `engine.operation.error`, {
          operation: operationType,
          function: propertyName,
          error: error instanceof Error ? error.message : String(error),
          duration_ms: Math.round(duration),
          context: operationContext,
        });

        // End tracing span
        observability.endSpan(spanId);

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Utility function to measure operation duration
 */
export function measureOperation<T>(
  operationType: OperationType,
  operation: () => T,
  context?: Record<string, any>
): T {
  const startTime = performance.now();

  try {
    const result = operation();

    const duration = performance.now() - startTime;
    observability.recordOperation(operationType, duration);

    observability.log("debug", `engine.operation.duration`, {
      operation: operationType,
      duration_ms: Math.round(duration),
      context,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    observability.recordOperation(operationType, duration);

    observability.log("error", `engine.operation.error`, {
      operation: operationType,
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Math.round(duration),
      context,
    });

    throw error;
  }
}
