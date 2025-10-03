/**
 * @fileoverview Tests for observability utilities
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  Logger,
  LogLevel,
  MetricsCollector,
  MetricType,
  PerformanceTracer,
  createObservability,
} from "../src/observability.js";

describe("Logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger(true, LogLevel.DEBUG);
  });

  it("should log error messages", () => {
    logger.error("test.error", "Test error", { code: 500 });
    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe(LogLevel.ERROR);
    expect(logs[0].category).toBe("test.error");
    expect(logs[0].message).toBe("Test error");
  });

  it("should log warn messages", () => {
    logger.warn("test.warn", "Test warning");
    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe(LogLevel.WARN);
  });

  it("should log info messages", () => {
    logger.info("test.info", "Test info");
    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe(LogLevel.INFO);
  });

  it("should log debug messages", () => {
    logger.debug("test.debug", "Test debug");
    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe(LogLevel.DEBUG);
  });

  it("should respect min log level", () => {
    const warnLogger = new Logger(true, LogLevel.WARN);
    warnLogger.debug("test", "Should not log");
    warnLogger.info("test", "Should not log");
    warnLogger.warn("test", "Should log");
    warnLogger.error("test", "Should log");

    const logs = warnLogger.getLogs();
    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe(LogLevel.WARN);
    expect(logs[1].level).toBe(LogLevel.ERROR);
  });

  it("should clear logs", () => {
    logger.info("test", "Message");
    expect(logger.getLogs().length).toBe(1);
    logger.clear();
    expect(logger.getLogs().length).toBe(0);
  });

  it("should not log when disabled", () => {
    const disabledLogger = new Logger(false);
    disabledLogger.error("test", "Message");
    expect(disabledLogger.getLogs().length).toBe(0);
  });
});

describe("MetricsCollector", () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = new MetricsCollector(true);
  });

  it("should record counter metrics", () => {
    metrics.counter("test_counter", 5);
    const allMetrics = metrics.getMetrics();
    expect(allMetrics.length).toBe(1);
    expect(allMetrics[0].name).toBe("test_counter");
    expect(allMetrics[0].type).toBe(MetricType.COUNTER);
    expect(allMetrics[0].value).toBe(5);
  });

  it("should increment counters", () => {
    metrics.counter("test_counter", 5);
    metrics.counter("test_counter", 3);
    const metric = metrics.getMetric("test_counter");
    expect(metric?.value).toBe(8);
  });

  it("should record gauge metrics", () => {
    metrics.gauge("test_gauge", 42.5);
    const metric = metrics.getMetric("test_gauge");
    expect(metric?.type).toBe(MetricType.GAUGE);
    expect(metric?.value).toBe(42.5);
  });

  it("should record histogram metrics", () => {
    metrics.histogram("test_histogram", 123.45);
    const metric = metrics.getMetric("test_histogram");
    expect(metric?.type).toBe(MetricType.HISTOGRAM);
    expect(metric?.value).toBe(123.45);
  });

  it("should support metric labels", () => {
    metrics.counter("requests", 1, { method: "GET", status: "200" });
    metrics.counter("requests", 1, { method: "POST", status: "201" });

    const allMetrics = metrics.getMetrics();
    expect(allMetrics.length).toBe(2);

    const getMetric = metrics.getMetric("requests", {
      method: "GET",
      status: "200",
    });
    expect(getMetric?.value).toBe(1);
  });

  it("should clear metrics", () => {
    metrics.counter("test", 1);
    expect(metrics.getMetrics().length).toBe(1);
    metrics.clear();
    expect(metrics.getMetrics().length).toBe(0);
  });

  it("should not record when disabled", () => {
    const disabledMetrics = new MetricsCollector(false);
    disabledMetrics.counter("test", 1);
    expect(disabledMetrics.getMetrics().length).toBe(0);
  });
});

describe("PerformanceTracer", () => {
  let tracer: PerformanceTracer;

  beforeEach(() => {
    tracer = new PerformanceTracer(true);
  });

  it("should start and end traces", () => {
    tracer.start("test_operation");
    tracer.end("test_operation");

    const spans = tracer.getSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe("test_operation");
    expect(spans[0].duration).toBeGreaterThanOrEqual(0);
  });

  it("should track active spans", () => {
    tracer.start("operation1");
    tracer.start("operation2");

    const activeSpans = tracer.getActiveSpans();
    expect(activeSpans.length).toBe(2);

    tracer.end("operation1");
    expect(tracer.getActiveSpans().length).toBe(1);
  });

  it("should measure function execution", async () => {
    const result = await tracer.measure("test_fn", async () => {
      return "success";
    });

    expect(result).toBe("success");
    const spans = tracer.getSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe("test_fn");
  });

  it("should handle errors in measured functions", async () => {
    await expect(
      tracer.measure("error_fn", async () => {
        throw new Error("Test error");
      })
    ).rejects.toThrow("Test error");

    // Span should still be recorded
    const spans = tracer.getSpans();
    expect(spans.length).toBe(1);
  });

  it("should store metadata with spans", () => {
    tracer.start("test", { userId: 123, action: "render" });
    tracer.end("test");

    const spans = tracer.getSpans();
    expect(spans[0].metadata).toEqual({ userId: 123, action: "render" });
  });

  it("should clear spans", () => {
    tracer.start("test");
    tracer.end("test");
    expect(tracer.getSpans().length).toBe(1);
    tracer.clear();
    expect(tracer.getSpans().length).toBe(0);
  });

  it("should not trace when disabled", () => {
    const disabledTracer = new PerformanceTracer(false);
    disabledTracer.start("test");
    disabledTracer.end("test");
    expect(disabledTracer.getSpans().length).toBe(0);
  });
});

describe("Observability", () => {
  it("should create observability instance", () => {
    const obs = createObservability();
    expect(obs.logger).toBeDefined();
    expect(obs.metrics).toBeDefined();
    expect(obs.tracer).toBeDefined();
  });

  it("should disable all observability", () => {
    const obs = createObservability();
    obs.logger.info("test", "message");
    obs.metrics.counter("test", 1);
    obs.tracer.start("test");
    obs.tracer.end("test");

    expect(obs.logger.getLogs().length).toBeGreaterThan(0);
    expect(obs.metrics.getMetrics().length).toBeGreaterThan(0);
    expect(obs.tracer.getSpans().length).toBeGreaterThan(0);

    obs.disable();

    // After disable, new operations should not be recorded
    obs.logger.info("test2", "message2");
    obs.metrics.counter("test2", 1);
    obs.tracer.start("test2");
    obs.tracer.end("test2");

    // Should still have the original entries but no new ones
    const logs = obs.logger.getLogs();
    const metrics = obs.metrics.getMetrics();
    const spans = obs.tracer.getSpans();

    expect(logs.every((l) => l.category !== "test2")).toBe(true);
    expect(metrics.every((m) => m.name !== "test2")).toBe(true);
    expect(spans.every((s) => s.name !== "test2")).toBe(true);
  });

  it("should clear all observability data", () => {
    const obs = createObservability();
    obs.logger.info("test", "message");
    obs.metrics.counter("test", 1);
    obs.tracer.start("test");
    obs.tracer.end("test");

    obs.clear();

    expect(obs.logger.getLogs().length).toBe(0);
    expect(obs.metrics.getMetrics().length).toBe(0);
    expect(obs.tracer.getSpans().length).toBe(0);
  });
});

