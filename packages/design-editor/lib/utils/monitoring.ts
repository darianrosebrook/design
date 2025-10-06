/**
 * Monitoring and observability system for design system operations
 * @author @darianrosebrook
 *
 * Provides comprehensive monitoring with:
 * - Performance metrics collection
 * - Component usage analytics
 * - Error tracking and alerting
 * - Health checks and diagnostics
 * - Usage patterns and insights
 */

import type { ComponentType } from "react";
import type { IngestedComponent } from "./dynamic-component-registry";
import { getComponentCache } from "./component-cache";
import { getErrorRecoveryManager } from "./error-recovery.tsx";

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = "counter",
  GAUGE = "gauge",
  HISTOGRAM = "histogram",
  SUMMARY = "summary",
}

/**
 * Component operation types
 */
export enum ComponentOperation {
  INGEST = "ingest",
  RENDER = "render",
  VALIDATE = "validate",
  CACHE_HIT = "cache_hit",
  CACHE_MISS = "cache_miss",
  ERROR = "error",
  FALLBACK = "fallback",
}

/**
 * System health status
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
  UNKNOWN = "unknown",
}

/**
 * Metric data point
 */
export interface MetricDataPoint {
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

/**
 * Component usage statistics
 */
export interface ComponentUsageStats {
  componentId: string;
  totalRenders: number;
  averageRenderTime: number;
  errorCount: number;
  cacheHitRate: number;
  lastUsed: number;
  peakUsage: number;
}

/**
 * System performance metrics
 */
export interface SystemMetrics {
  uptime: number;
  memoryUsage: number;
  componentCount: number;
  cacheStats: any;
  errorStats: any;
  throughput: {
    componentsPerSecond: number;
    operationsPerSecond: number;
  };
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  checks: Record<
    string,
    {
      status: HealthStatus;
      message: string;
      details?: any;
    }
  >;
  timestamp: number;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  metricsRetentionHours: number;
  alertThresholds: {
    errorRate: number;
    performanceDegradation: number;
    memoryUsage: number;
  };
  healthCheckInterval: number;
}

/**
 * Design system monitor
 */
export class DesignSystemMonitor {
  private metrics: MetricDataPoint[] = [];
  private componentStats = new Map<string, ComponentUsageStats>();
  private traces: any[] = [];
  private config: MonitoringConfig;
  private startTime = Date.now();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableMetrics: true,
      enableTracing: false,
      metricsRetentionHours: 24,
      alertThresholds: {
        errorRate: 0.05, // 5% error rate
        performanceDegradation: 2.0, // 2x slower
        memoryUsage: 100 * 1024 * 1024, // 100MB
      },
      healthCheckInterval: 30000, // 30 seconds
      ...config,
    };

    // Start periodic cleanup
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Hourly cleanup
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    type: MetricType,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    if (!this.config.enableMetrics) return;

    const metric: MetricDataPoint = {
      name,
      type,
      value,
      labels,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Check alert thresholds
    this.checkAlerts(metric);
  }

  /**
   * Record component operation
   */
  recordComponentOperation(
    operation: ComponentOperation,
    componentId: string,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    // Update component statistics
    this.updateComponentStats(componentId, operation, duration);

    // Record metric
    const labels = {
      operation,
      componentId,
      ...metadata,
    };

    this.recordMetric(`component_${operation}`, MetricType.COUNTER, 1, labels);

    if (duration !== undefined) {
      this.recordMetric(
        `component_${operation}_duration`,
        MetricType.HISTOGRAM,
        duration,
        labels
      );
    }
  }

  /**
   * Record error
   */
  recordError(error: Error, context: Record<string, any> = {}): void {
    this.recordMetric("errors_total", MetricType.COUNTER, 1, {
      type: context.category || "unknown",
      operation: context.operation || "unknown",
    });

    if (this.config.enableTracing) {
      this.traces.push({
        type: "error",
        error: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Start performance measurement
   */
  startMeasurement(operation: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(
        `${operation}_duration`,
        MetricType.HISTOGRAM,
        duration,
        { operation }
      );
    };
  }

  /**
   * Update component usage statistics
   */
  private updateComponentStats(
    componentId: string,
    operation: ComponentOperation,
    duration?: number
  ): void {
    let stats = this.componentStats.get(componentId);

    if (!stats) {
      stats = {
        componentId,
        totalRenders: 0,
        averageRenderTime: 0,
        errorCount: 0,
        cacheHitRate: 0,
        lastUsed: Date.now(),
        peakUsage: 0,
      };
      this.componentStats.set(componentId, stats);
    }

    stats.lastUsed = Date.now();

    switch (operation) {
      case ComponentOperation.RENDER:
        stats.totalRenders++;
        if (duration !== undefined) {
          // Update rolling average
          const alpha = 0.1; // Smoothing factor
          stats.averageRenderTime =
            stats.averageRenderTime * (1 - alpha) + duration * alpha;
        }
        break;

      case ComponentOperation.ERROR:
        stats.errorCount++;
        break;

      case ComponentOperation.CACHE_HIT:
        // Cache hit rate calculation would need more data
        break;
    }
  }

  /**
   * Check alert thresholds
   */
  private checkAlerts(metric: MetricDataPoint): void {
    // Error rate alert
    if (metric.name === "errors_total") {
      const recentErrors = this.getRecentMetrics("errors_total", 5 * 60 * 1000); // Last 5 minutes
      const totalOps = this.getRecentMetrics(
        "component_render",
        5 * 60 * 1000
      ).length;
      const errorRate = totalOps > 0 ? recentErrors.length / totalOps : 0;

      if (errorRate > this.config.alertThresholds.errorRate) {
        console.warn(
          `🚨 ALERT: High error rate detected: ${(errorRate * 100).toFixed(1)}%`
        );
      }
    }

    // Performance degradation alert
    if (metric.name.includes("_duration")) {
      const baseline = this.getBaselineDuration(
        metric.name.replace("_duration", "")
      );
      if (
        baseline > 0 &&
        metric.value >
          baseline * this.config.alertThresholds.performanceDegradation
      ) {
        console.warn(
          `🚨 ALERT: Performance degradation in ${metric.name}: ${(
            metric.value / baseline
          ).toFixed(1)}x slower`
        );
      }
    }
  }

  /**
   * Get baseline duration for operation (simple moving average)
   */
  private getBaselineDuration(operation: string): number {
    const recentDurations = this.metrics
      .filter((m) => m.name === `${operation}_duration`)
      .slice(-10) // Last 10 measurements
      .map((m) => m.value);

    if (recentDurations.length === 0) return 0;

    const sorted = recentDurations.sort((a, b) => a - b);
    // Use median to avoid outliers
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Get recent metrics
   */
  private getRecentMetrics(
    name: string,
    timeWindowMs: number
  ): MetricDataPoint[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.filter((m) => m.name === name && m.timestamp > cutoff);
  }

  /**
   * Get component usage statistics
   */
  getComponentUsageStats(componentId?: string): ComponentUsageStats[] {
    const stats = Array.from(this.componentStats.values());

    if (componentId) {
      return stats.filter((s) => s.componentId === componentId);
    }

    return stats;
  }

  /**
   * Get system performance metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const cache = getComponentCache();
    const errorRecovery = getErrorRecoveryManager();

    return {
      uptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage().heapUsed,
      componentCount: this.componentStats.size,
      cacheStats: cache.getStats(),
      errorStats: errorRecovery.getErrorStats(),
      throughput: {
        componentsPerSecond: this.calculateThroughput("component_render", 60),
        operationsPerSecond: this.calculateThroughput("component_.*", 60),
      },
    };
  }

  /**
   * Calculate throughput (operations per second)
   */
  private calculateThroughput(pattern: string, windowSeconds: number): number {
    const windowMs = windowSeconds * 1000;
    const recentOps = this.metrics.filter((m) => {
      const regex = new RegExp(pattern);
      return regex.test(m.name) && Date.now() - m.timestamp < windowMs;
    });

    return recentOps.length / windowSeconds;
  }

  /**
   * Perform health checks
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: Record<string, any> = {};

    // Component registry health
    try {
      const cache = getComponentCache();
      const cacheStats = cache.getStats();
      checks.cache = {
        status:
          cacheStats.totalSize < this.config.alertThresholds.memoryUsage
            ? HealthStatus.HEALTHY
            : HealthStatus.DEGRADED,
        message: `Cache contains ${cacheStats.entries} entries, ${Math.round(
          cacheStats.totalSize / 1024
        )}KB`,
        details: cacheStats,
      };
    } catch (error) {
      checks.cache = {
        status: HealthStatus.UNHEALTHY,
        message: "Cache health check failed",
        details: error,
      };
    }

    // Error recovery health
    try {
      const errorRecovery = getErrorRecoveryManager();
      const errorStats = errorRecovery.getErrorStats();
      const errorRate =
        errorStats.total > 0 ? errorStats.unresolved / errorStats.total : 0;
      checks.errors = {
        status:
          errorRate < this.config.alertThresholds.errorRate
            ? HealthStatus.HEALTHY
            : HealthStatus.DEGRADED,
        message: `${errorStats.unresolved} unresolved errors out of ${errorStats.total} total`,
        details: errorStats,
      };
    } catch (error) {
      checks.errors = {
        status: HealthStatus.UNHEALTHY,
        message: "Error recovery health check failed",
        details: error,
      };
    }

    // Memory health
    const memUsage = process.memoryUsage().heapUsed;
    checks.memory = {
      status:
        memUsage < this.config.alertThresholds.memoryUsage
          ? HealthStatus.HEALTHY
          : HealthStatus.DEGRADED,
      message: `Memory usage: ${Math.round(memUsage / 1024 / 1024)}MB`,
      details: {
        usage: memUsage,
        limit: this.config.alertThresholds.memoryUsage,
      },
    };

    // Overall health
    const hasUnhealthy = Object.values(checks).some(
      (c) => c.status === HealthStatus.UNHEALTHY
    );
    const hasDegraded = Object.values(checks).some(
      (c) => c.status === HealthStatus.DEGRADED
    );

    let overallStatus = HealthStatus.HEALTHY;
    if (hasUnhealthy) overallStatus = HealthStatus.UNHEALTHY;
    else if (hasDegraded) overallStatus = HealthStatus.DEGRADED;

    return {
      status: overallStatus,
      checks,
      timestamp: Date.now(),
    };
  }

  /**
   * Get usage analytics and insights
   */
  getUsageAnalytics(): {
    topComponents: ComponentUsageStats[];
    performanceInsights: string[];
    errorInsights: string[];
    recommendations: string[];
  } {
    const stats = Array.from(this.componentStats.values());

    // Top components by usage
    const topComponents = stats
      .sort((a, b) => b.totalRenders - a.totalRenders)
      .slice(0, 10);

    // Performance insights
    const performanceInsights: string[] = [];
    const slowComponents = stats.filter((s) => s.averageRenderTime > 100); // > 100ms
    if (slowComponents.length > 0) {
      performanceInsights.push(
        `${slowComponents.length} components have slow render times (>100ms)`
      );
    }

    // Error insights
    const errorInsights: string[] = [];
    const errorComponents = stats.filter((s) => s.errorCount > 0);
    if (errorComponents.length > 0) {
      errorInsights.push(
        `${errorComponents.length} components have experienced errors`
      );
    }

    // Recommendations
    const recommendations: string[] = [];

    if (slowComponents.length > 3) {
      recommendations.push(
        "Consider optimizing slow-rendering components or implementing virtualization"
      );
    }

    if (errorComponents.length > stats.length * 0.1) {
      recommendations.push(
        "High error rate detected - review component quality and error handling"
      );
    }

    const cacheStats = getComponentCache().getStats();
    if (cacheStats.hitRate < 0.5) {
      recommendations.push(
        "Low cache hit rate - consider adjusting cache TTL or preload strategy"
      );
    }

    return {
      topComponents,
      performanceInsights,
      errorInsights,
      recommendations,
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    metrics: MetricDataPoint[];
    traces: any[];
    stats: {
      components: ComponentUsageStats[];
      system: SystemMetrics;
    };
  } {
    return {
      metrics: [...this.metrics],
      traces: [...this.traces],
      stats: {
        components: this.getComponentUsageStats(),
        system: null as any, // Would need to be awaited in real usage
      },
    };
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    const retentionMs = this.config.metricsRetentionHours * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;

    // Clean metrics
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);

    // Clean traces
    this.traces = this.traces.filter((t) => t.timestamp > cutoff);

    // Clean component stats (remove very old unused components)
    const oldCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    for (const [id, stats] of this.componentStats) {
      if (stats.lastUsed < oldCutoff && stats.totalRenders === 0) {
        this.componentStats.delete(id);
      }
    }
  }
}

/**
 * Global monitor instance
 */
let globalMonitor: DesignSystemMonitor | null = null;

/**
 * Get global design system monitor
 */
export function getDesignSystemMonitor(): DesignSystemMonitor {
  if (!globalMonitor) {
    globalMonitor = new DesignSystemMonitor();
  }
  return globalMonitor;
}

/**
 * Reset global monitor (for testing)
 */
export function resetDesignSystemMonitor(): void {
  if (globalMonitor) {
    globalMonitor = null;
  }
}

/**
 * Performance measurement decorator
 */
export function measurePerformance(operation: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const monitor = getDesignSystemMonitor();
      const endMeasurement = monitor.startMeasurement(operation);

      try {
        const result = method.apply(this, args);
        endMeasurement();
        return result;
      } catch (error) {
        endMeasurement();
        monitor.recordError(error as Error, {
          operation,
          method: propertyName,
        });
        throw error;
      }
    };
  };
}
