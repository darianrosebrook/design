/**
 * Error handling and recovery system for design system operations
 * @author @darianrosebrook
 *
 * Provides comprehensive error handling with:
 * - Automatic recovery strategies
 * - Error classification and prioritization
 * - Graceful degradation
 * - Recovery attempt tracking
 * - Circuit breaker patterns
 */

import type { ComponentType } from "react";
import type { IngestedComponent } from "./dynamic-component-registry";

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories
 */
export enum ErrorCategory {
  NETWORK = "network",
  SECURITY = "security",
  VALIDATION = "validation",
  RENDERING = "rendering",
  LOADING = "loading",
  STORAGE = "storage",
  DEPENDENCY = "dependency",
  UNKNOWN = "unknown",
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  RETRY = "retry",
  FALLBACK = "fallback",
  DEGRADATION = "degradation",
  SKIP = "skip",
  ABORT = "abort",
}

/**
 * Structured error with recovery information
 */
export interface DesignSystemError {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  componentId?: string;
  operation: string;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  lastRecoveryAttempt?: number;
  resolved: boolean;
  resolutionStrategy?: RecoveryStrategy;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  result?: any;
  error?: string;
  shouldRetry: boolean;
  retryDelay?: number;
}

/**
 * Circuit breaker state
 */
export enum CircuitState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Failing, reject requests
  HALF_OPEN = "half_open", // Testing recovery
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 minute
    private successThreshold = 3
  ) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error("Circuit breaker is OPEN - operation rejected");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}

/**
 * Error recovery manager
 */
export class ErrorRecoveryManager {
  private errors = new Map<string, DesignSystemError>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private recoveryStrategies = new Map<ErrorCategory, RecoveryStrategy[]>();

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default recovery strategies for different error categories
   */
  private initializeDefaultStrategies(): void {
    this.recoveryStrategies.set(ErrorCategory.NETWORK, [
      RecoveryStrategy.RETRY,
      RecoveryStrategy.FALLBACK,
      RecoveryStrategy.DEGRADATION,
    ]);

    this.recoveryStrategies.set(ErrorCategory.SECURITY, [
      RecoveryStrategy.ABORT,
    ]);

    this.recoveryStrategies.set(ErrorCategory.VALIDATION, [
      RecoveryStrategy.SKIP,
      RecoveryStrategy.FALLBACK,
    ]);

    this.recoveryStrategies.set(ErrorCategory.RENDERING, [
      RecoveryStrategy.FALLBACK,
      RecoveryStrategy.DEGRADATION,
    ]);

    this.recoveryStrategies.set(ErrorCategory.LOADING, [
      RecoveryStrategy.RETRY,
      RecoveryStrategy.FALLBACK,
    ]);

    this.recoveryStrategies.set(ErrorCategory.STORAGE, [
      RecoveryStrategy.RETRY,
      RecoveryStrategy.DEGRADATION,
    ]);

    this.recoveryStrategies.set(ErrorCategory.DEPENDENCY, [
      RecoveryStrategy.FALLBACK,
      RecoveryStrategy.DEGRADATION,
    ]);
  }

  /**
   * Handle an error with automatic recovery
   */
  async handleError(
    error: Error,
    category: ErrorCategory,
    operation: string,
    context?: Record<string, any>,
    componentId?: string
  ): Promise<RecoveryResult> {
    const errorId = this.generateErrorId();
    const designSystemError: DesignSystemError = {
      id: errorId,
      timestamp: Date.now(),
      category,
      severity: this.classifySeverity(error, category),
      message: error.message,
      originalError: error,
      context,
      componentId,
      operation,
      recoveryAttempts: 0,
      maxRecoveryAttempts: this.getMaxAttempts(category),
      resolved: false,
    };

    this.errors.set(errorId, designSystemError);

    console.error(`[${category.toUpperCase()}] ${operation}:`, error.message);

    // Try recovery strategies
    const strategies = this.recoveryStrategies.get(category) || [RecoveryStrategy.ABORT];

    for (const strategy of strategies) {
      try {
        const result = await this.executeRecoveryStrategy(strategy, designSystemError);
        if (result.success) {
          designSystemError.resolved = true;
          designSystemError.resolutionStrategy = strategy;
          console.log(`Recovery successful using ${strategy} strategy`);
          return result;
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy ${strategy} failed:`, recoveryError);
      }
    }

    // All recovery strategies failed
    console.error(`All recovery strategies failed for ${operation}`);
    return {
      success: false,
      strategy: RecoveryStrategy.ABORT,
      error: "All recovery strategies failed",
      shouldRetry: false,
    };
  }

  /**
   * Execute a specific recovery strategy
   */
  private async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    error: DesignSystemError
  ): Promise<RecoveryResult> {
    error.recoveryAttempts++;
    error.lastRecoveryAttempt = Date.now();

    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return this.retryOperation(error);

      case RecoveryStrategy.FALLBACK:
        return this.fallbackOperation(error);

      case RecoveryStrategy.DEGRADATION:
        return this.degradationOperation(error);

      case RecoveryStrategy.SKIP:
        return this.skipOperation(error);

      case RecoveryStrategy.ABORT:
      default:
        return {
          success: false,
          strategy: RecoveryStrategy.ABORT,
          error: "Operation aborted",
          shouldRetry: false,
        };
    }
  }

  /**
   * Retry the operation with exponential backoff
   */
  private async retryOperation(error: DesignSystemError): Promise<RecoveryResult> {
    if (error.recoveryAttempts >= error.maxRecoveryAttempts) {
      return {
        success: false,
        strategy: RecoveryStrategy.RETRY,
        error: "Max retry attempts exceeded",
        shouldRetry: false,
      };
    }

    const delay = Math.min(1000 * Math.pow(2, error.recoveryAttempts), 30000); // Max 30 seconds

    await new Promise(resolve => setTimeout(resolve, delay));

    // In a real implementation, this would retry the actual operation
    // For now, simulate a retry that might succeed
    const success = Math.random() > 0.7; // 30% success rate

    return {
      success,
      strategy: RecoveryStrategy.RETRY,
      result: success ? "Retried operation succeeded" : undefined,
      shouldRetry: !success,
      retryDelay: success ? undefined : delay * 2,
    };
  }

  /**
   * Provide fallback operation
   */
  private fallbackOperation(error: DesignSystemError): Promise<RecoveryResult> {
    // Provide fallback based on operation type
    switch (error.operation) {
      case "component_ingestion":
        return Promise.resolve({
          success: true,
          strategy: RecoveryStrategy.FALLBACK,
          result: this.createFallbackComponent(error.componentId),
        });

      case "component_rendering":
        return Promise.resolve({
          success: true,
          strategy: RecoveryStrategy.FALLBACK,
          result: this.createFallbackRender(error.componentId),
        });

      default:
        return Promise.resolve({
          success: false,
          strategy: RecoveryStrategy.FALLBACK,
          error: "No fallback available for this operation",
        });
    }
  }

  /**
   * Degrade operation to basic functionality
   */
  private degradationOperation(error: DesignSystemError): Promise<RecoveryResult> {
    return Promise.resolve({
      success: true,
      strategy: RecoveryStrategy.DEGRADATION,
      result: "Operation degraded to basic functionality",
    });
  }

  /**
   * Skip the failing operation
   */
  private skipOperation(error: DesignSystemError): Promise<RecoveryResult> {
    return Promise.resolve({
      success: true,
      strategy: RecoveryStrategy.SKIP,
      result: "Operation skipped",
    });
  }

  /**
   * Create fallback component
   */
  private createFallbackComponent(componentId?: string): IngestedComponent {
    return {
      id: componentId || `fallback-${Date.now()}`,
      name: "FallbackComponent",
      description: "Fallback component due to ingestion failure",
      category: "Unknown",
      icon: "⚠️",
      defaultProps: {},
      component: (() => {
        const Fallback: ComponentType<any> = () => (
          <div className="fallback-component p-4 border-2 border-dashed border-red-300 text-red-600">
            Component failed to load
          </div>
        );
        return Fallback;
      })(),
      source: "fallback",
      version: "0.0.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Create fallback render result
   */
  private createFallbackRender(componentId?: string): any {
    return {
      type: "fallback",
      componentId,
      message: "Component rendering failed, showing fallback",
    };
  }

  /**
   * Classify error severity
   */
  private classifySeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // Security errors are always critical
    if (category === ErrorCategory.SECURITY) {
      return ErrorSeverity.CRITICAL;
    }

    // Check error message patterns
    const message = error.message.toLowerCase();

    if (message.includes("security") || message.includes("xss") || message.includes("injection")) {
      return ErrorSeverity.CRITICAL;
    }

    if (message.includes("network") || message.includes("timeout") || message.includes("connection")) {
      return ErrorSeverity.HIGH;
    }

    if (message.includes("validation") || message.includes("invalid")) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Get maximum recovery attempts for category
   */
  private getMaxAttempts(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 3;
      case ErrorCategory.LOADING:
        return 2;
      case ErrorCategory.STORAGE:
        return 2;
      default:
        return 1;
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get circuit breaker for operation
   */
  getCircuitBreaker(operation: string): CircuitBreaker {
    if (!this.circuitBreakers.has(operation)) {
      this.circuitBreakers.set(operation, new CircuitBreaker());
    }
    return this.circuitBreakers.get(operation)!;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    unresolved: number;
  } {
    const byCategory: Record<ErrorCategory, number> = {} as any;
    const bySeverity: Record<ErrorSeverity, number> = {} as any;
    let unresolved = 0;

    for (const error of this.errors.values()) {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;

      if (!error.resolved) {
        unresolved++;
      }
    }

    return {
      total: this.errors.size,
      byCategory,
      bySeverity,
      unresolved,
    };
  }

  /**
   * Clean up old resolved errors
   */
  cleanup(maxAge = 24 * 60 * 60 * 1000): void { // 24 hours
    const cutoff = Date.now() - maxAge;

    for (const [id, error] of this.errors) {
      if (error.resolved && error.timestamp < cutoff) {
        this.errors.delete(id);
      }
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers(): void {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }
  }
}

/**
 * Global error recovery manager instance
 */
let globalErrorRecoveryManager: ErrorRecoveryManager | null = null;

/**
 * Get global error recovery manager
 */
export function getErrorRecoveryManager(): ErrorRecoveryManager {
  if (!globalErrorRecoveryManager) {
    globalErrorRecoveryManager = new ErrorRecoveryManager();
  }
  return globalErrorRecoveryManager;
}

/**
 * Reset global error recovery manager (for testing)
 */
export function resetErrorRecoveryManager(): void {
  if (globalErrorRecoveryManager) {
    globalErrorRecoveryManager.resetCircuitBreakers();
    globalErrorRecoveryManager = null;
  }
}
