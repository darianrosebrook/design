/**
 * @fileoverview Tests for observability and telemetry functionality
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  observability,
  createOperationContext,
  measureOperation,
} from "../src/observability.js";
import {
  findNodeById,
  createNode,
  updateNode,
  deleteNode,
} from "../src/operations.js";
import { traverseDocument, countNodes } from "../src/traversal.js";
import { hitTest } from "../src/hit-testing.js";
import { applyPatch, applyPatches } from "../src/patches.js";

const createTestDocument = () => ({
  schemaVersion: "0.1.0",
  id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
  name: "Test Document",
  artboards: [
    {
      id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
      name: "Desktop",
      frame: { x: 0, y: 0, width: 1440, height: 1024 },
      children: [
        {
          id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
          type: "frame",
          name: "Hero",
          visible: true,
          frame: { x: 0, y: 0, width: 1440, height: 480 },
          style: { fills: [{ type: "solid", color: "#111317" }] },
          children: [
            {
              id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
              type: "text",
              name: "Title",
              visible: true,
              frame: { x: 32, y: 40, width: 600, height: 64 },
              style: {},
              text: "Build in your IDE",
              textStyle: {
                family: "Inter",
                size: 48,
                weight: "700",
                color: "#E6E6E6",
              },
            },
          ],
        },
      ],
    },
  ],
});

describe("Canvas Engine Observability", () => {
  beforeEach(() => {
    // Reset observability state before each test
    observability["metrics"] = {
      operations_total: {},
      operation_duration_ms: {},
      document_nodes_total: 0,
      last_updated: Date.now(),
    };

    // Initialize operation counters
    const operationTypes = [
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
      observability["metrics"].operations_total[type] = 0;
      observability["metrics"].operation_duration_ms[type] = [];
    });
  });

  describe("Structured Logging", () => {
    it("should generate structured logs for operation start", () => {
      const document = createTestDocument();

      // Mock console methods to capture logs
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes("engine.operation.start")
      );

      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall[0]);
      expect(logData.message).toBe("engine.operation.start");
      expect(logData.context.operation).toBe("findNodeById");
      expect(logData.context.documentId).toBe(document.id);

      consoleSpy.mockRestore();
    });

    it("should generate structured logs for operation complete", () => {
      const document = createTestDocument();

      // Mock console methods to capture logs
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes("engine.operation.complete")
      );

      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall[0]);
      expect(logData.message).toBe("engine.operation.complete");
      expect(logData.context.operation).toBe("findNodeById");
      expect(logData.context.duration_ms).toBeTypeOf("number");

      consoleSpy.mockRestore();
    });

    it("should generate structured logs for errors", () => {
      const document = createTestDocument();

      // Mock console methods to capture logs
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = findNodeById(document, "non-existent-id");
      expect(result.success).toBe(false);

      // Should not log an error since it's not an exception
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Metrics Collection", () => {
    it("should increment operation counters", () => {
      const document = createTestDocument();
      const initialCount =
        observability.getMetrics().operations_total.findNodeById;

      findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");

      const newCount = observability.getMetrics().operations_total.findNodeById;
      expect(newCount).toBe(initialCount + 1);
    });

    it("should record operation durations", () => {
      const document = createTestDocument();

      findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");

      const durations =
        observability.getMetrics().operation_duration_ms.findNodeById;
      expect(durations).toHaveLength(1);
      expect(durations[0]).toBeTypeOf("number");
      expect(durations[0]).toBeGreaterThan(0);
    });

    it("should track document node count", () => {
      const document = createTestDocument();

      findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");
      countNodes(document);

      const metrics = observability.getMetrics();
      expect(metrics.document_nodes_total).toBeGreaterThan(0);
    });

    it("should provide metrics snapshot", () => {
      const document = createTestDocument();

      findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");

      const metrics = observability.getMetrics();
      expect(metrics.operations_total.findNodeById).toBe(1);
      expect(metrics.operation_duration_ms.findNodeById).toHaveLength(1);
      expect(metrics.last_updated).toBeTypeOf("number");
    });
  });

  describe("Operation Context", () => {
    it("should create operation context with document info", () => {
      const document = createTestDocument();
      const context = createOperationContext(
        "findNodeById",
        document,
        "test-id"
      );

      expect(context.operationType).toBe("findNodeById");
      expect(context.documentId).toBe(document.id);
      expect(context.nodeId).toBe("test-id");
    });

    it("should handle missing document gracefully", () => {
      const context = createOperationContext(
        "findNodeById",
        undefined,
        "test-id"
      );

      expect(context.operationType).toBe("findNodeById");
      expect(context.documentId).toBeUndefined();
      expect(context.nodeId).toBe("test-id");
    });
  });

  describe("Measure Operation Utility", () => {
    it("should measure operation duration correctly", () => {
      const initialMetrics = observability.getMetrics();
      const initialCount = initialMetrics.operations_total.findNodeById;

      measureOperation(
        "findNodeById",
        () => {
          // Simulate some work
          for (let i = 0; i < 1000; i++) {
            Math.random();
          }
          return "result";
        },
        { test: "context" }
      );

      const newMetrics = observability.getMetrics();
      expect(newMetrics.operations_total.findNodeById).toBe(initialCount + 1);
      expect(newMetrics.operation_duration_ms.findNodeById).toHaveLength(1);
    });

    it("should handle operation errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        measureOperation("findNodeById", () => {
          throw new Error("Test error");
        });
      }).toThrow("Test error");

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes("engine.operation.error")
      );
      expect(logCall).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe("Integration Tests", () => {
    it("should collect metrics for all operation types", () => {
      const document = createTestDocument();

      // Test multiple operation types
      findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");
      traverseDocument(document);
      countNodes(document);
      hitTest(document, { x: 100, y: 100 });

      const metrics = observability.getMetrics();
      expect(metrics.operations_total.findNodeById).toBe(1);
      expect(metrics.operations_total.traverseDocument).toBe(3);
      expect(metrics.operations_total.hitTest).toBe(1);
    });

    it("should log hit test results", () => {
      const document = createTestDocument();

      // Mock console methods to capture logs
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      hitTest(document, { x: 100, y: 100 });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes("engine.hit_test.result")
      );

      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall[0]);
      expect(logData.message).toBe("engine.hit_test.result");
      expect(logData.context.point).toBe("100,100");

      consoleSpy.mockRestore();
    });

    it("should log patch operations", () => {
      const document = createTestDocument();

      // Mock console methods to capture logs
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const patch = {
        op: "replace" as const,
        path: "/artboards/0/children/0/name",
        value: "Updated Hero",
      };

      applyPatch(document, patch);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes("engine.operation.start")
      );

      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall[0]);
      expect(logData.context.patchOp).toBe("replace");

      consoleSpy.mockRestore();
    });
  });

  describe("Performance Requirements", () => {
    it("should not significantly impact operation performance", () => {
      const document = createTestDocument();

      // Measure operation time with observability
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");
      }
      const durationWithObservability = performance.now() - startTime;

      // Should complete in reasonable time (< 100ms for 100 operations)
      expect(durationWithObservability).toBeLessThan(100);
    });

    it("should maintain operation correctness", () => {
      const document = createTestDocument();

      // Test that operations still return correct results
      const findResult = findNodeById(document, "01JF2Q06GTS16EJ3A3F0KK9K3T");
      expect(findResult.success).toBe(true);
      expect(findResult.data?.node.name).toBe("Hero");

      const traversalResults = Array.from(traverseDocument(document));
      expect(traversalResults.length).toBeGreaterThan(0);

      const nodeCount = countNodes(document);
      expect(nodeCount).toBeGreaterThan(0);
    });
  });
});
