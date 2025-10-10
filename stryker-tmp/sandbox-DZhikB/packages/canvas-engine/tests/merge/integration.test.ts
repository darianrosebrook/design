/**
 * @fileoverview Integration tests for the complete merge pipeline
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import { detectConflicts } from "../../src/merge/conflict-detector.js";
import { diffDocuments } from "../../src/merge/diff/index.js";
import { resolveMergeConflicts } from "../../src/merge/resolution/index.js";
import {
  MERGE_TEST_SCENARIOS,
  getScenariosByTags,
  getConflictScenarios,
  getAutoResolvableScenarios,
  getComplexScenarios,
} from "./scenarios.js";

describe("Merge Pipeline Integration", () => {
  describe("Full Pipeline Tests", () => {
    it.each(MERGE_TEST_SCENARIOS.map((s) => [s.name, s]))(
      "handles scenario: %s",
      async (scenarioName, scenario) => {
        // 1. Detect conflicts
        const conflictResult = detectConflicts({
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
        });

        // 2. Verify conflict detection
        expect(conflictResult.conflicts).toHaveLength(
          scenario.expectedConflicts.count
        );
        expect(conflictResult.conflicts.map((c) => c.code)).toEqual(
          expect.arrayContaining(scenario.expectedConflicts.codes)
        );

        // 3. Generate semantic diff
        const diffResult = await diffDocuments(scenario.base, scenario.local);

        // 4. Attempt merge resolution
        const mergeContext = {
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
          target: "local" as const,
        };

        const resolutionResult = await resolveMergeConflicts(
          conflictResult.conflicts,
          mergeContext
        );

        // 5. Verify resolution outcomes
        expect(resolutionResult.resolutions).toHaveLength(
          scenario.expectedConflicts.count
        );
        expect(resolutionResult.unresolvedConflicts).toHaveLength(
          scenario.expectedConflicts.manualRequired
        );
        expect(
          resolutionResult.resolutions.filter((r) => r.applied)
        ).toHaveLength(scenario.expectedConflicts.autoResolvable);

        // 6. Verify confidence scoring
        if (scenario.expectedConflicts.count === 0) {
          expect(resolutionResult.confidence).toBe(1.0);
        } else if (scenario.expectedConflicts.autoResolvable === 0) {
          // Only manual conflicts - confidence should be 0
          expect(resolutionResult.confidence).toBe(0);
        } else {
          // Mixed or auto-resolvable conflicts
          expect(resolutionResult.confidence).toBeGreaterThan(0);
          expect(resolutionResult.confidence).toBeLessThanOrEqual(1.0);
        }
      }
    );
  });

  describe("Auto-Resolution Scenarios", () => {
    const autoResolvableScenarios = getAutoResolvableScenarios();

    it.each(autoResolvableScenarios.map((s) => [s.name, s]))(
      "successfully auto-resolves: %s",
      async (scenarioName, scenario) => {
        const conflictResult = detectConflicts({
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
        });

        const mergeContext = {
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
          target: "local" as const,
        };

        const resolutionResult = await resolveMergeConflicts(
          conflictResult.conflicts,
          mergeContext
        );

        // Should have some applied resolutions
        expect(
          resolutionResult.resolutions.filter((r) => r.applied)
        ).toHaveLength(scenario.expectedConflicts.autoResolvable);

        // Should have reasonable confidence (may be lower for mixed scenarios)
        expect(resolutionResult.confidence).toBeGreaterThan(0.2);

        // Should not need manual review for auto-resolvable conflicts
        expect(resolutionResult.needsManualReview).toBe(
          scenario.expectedConflicts.manualRequired > 0
        );
      }
    );
  });

  describe("Manual Resolution Scenarios", () => {
    const manualScenarios = MERGE_TEST_SCENARIOS.filter(
      (s) => s.expectedConflicts.manualRequired > 0
    );

    it.each(manualScenarios.map((s) => [s.name, s]))(
      "requires manual review for: %s",
      async (scenarioName, scenario) => {
        const conflictResult = detectConflicts({
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
        });

        const mergeContext = {
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
          target: "local" as const,
        };

        const resolutionResult = await resolveMergeConflicts(
          conflictResult.conflicts,
          mergeContext
        );

        // Should have unresolved conflicts
        expect(resolutionResult.unresolvedConflicts).toHaveLength(
          scenario.expectedConflicts.manualRequired
        );

        // Should need manual review
        expect(resolutionResult.needsManualReview).toBe(true);

        // Should have lower confidence due to manual conflicts
        expect(resolutionResult.confidence).toBeLessThan(0.8);
      }
    );
  });

  describe("Complex Multi-Conflict Scenarios", () => {
    const complexScenarios = getComplexScenarios();

    it.each(complexScenarios.map((s) => [s.name, s]))(
      "handles complex scenario: %s",
      async (scenarioName, scenario) => {
        const conflictResult = detectConflicts({
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
        });

        // Should have multiple conflicts
        expect(conflictResult.conflicts.length).toBeGreaterThan(1);

        const mergeContext = {
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
          target: "local" as const,
        };

        const resolutionResult = await resolveMergeConflicts(
          conflictResult.conflicts,
          mergeContext
        );

        // Verify mixed resolution outcomes
        const appliedCount = resolutionResult.resolutions.filter(
          (r) => r.applied
        ).length;
        const manualCount = resolutionResult.unresolvedConflicts.length;

        expect(appliedCount).toBe(scenario.expectedConflicts.autoResolvable);
        expect(manualCount).toBe(scenario.expectedConflicts.manualRequired);

        // Verify confidence reflects mixed outcomes
        if (scenario.expectedConflicts.manualRequired > 0) {
          expect(resolutionResult.confidence).toBeLessThan(1.0);
        }
      }
    );
  });

  describe("Performance Tests", () => {
    const performanceScenarios = getScenariosByTags(["performance"]);

    it.each(performanceScenarios.map((s) => [s.name, s]))(
      "handles large documents efficiently: %s",
      async (scenarioName, scenario) => {
        const startTime = Date.now();

        // 1. Detect conflicts
        const conflictResult = detectConflicts({
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
        });

        // 2. Generate diffs
        const [localDiff, remoteDiff] = await Promise.all([
          diffDocuments(scenario.base, scenario.local),
          diffDocuments(scenario.base, scenario.remote),
        ]);

        // 3. Resolve conflicts
        const mergeContext = {
          base: scenario.base,
          local: scenario.local,
          remote: scenario.remote,
          target: "local" as const,
        };

        const resolutionResult = await resolveMergeConflicts(
          conflictResult.conflicts,
          mergeContext
        );

        const totalTime = Date.now() - startTime;

        // Performance assertions
        expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
        expect(conflictResult.conflicts.length).toBe(
          scenario.expectedConflicts.count
        );
        expect(resolutionResult.success).toBe(true);

        // Verify large document handling
        const totalNodes =
          countNodes(scenario.base) +
          countNodes(scenario.local) +
          countNodes(scenario.remote);
        expect(totalNodes).toBeGreaterThan(100); // Should handle documents with many nodes
      }
    );
  });

  describe("Edge Cases", () => {
    it("handles empty documents", async () => {
      const emptyDoc = {
        schemaVersion: "0.1.0",
        id: "EMPTY",
        name: "Empty",
        artboards: [],
      };

      const conflictResult = await detectConflicts({
        base: emptyDoc,
        local: emptyDoc,
        remote: emptyDoc,
      });

      expect(conflictResult.conflicts).toHaveLength(0);

      const mergeContext = {
        base: emptyDoc,
        local: emptyDoc,
        remote: emptyDoc,
        target: "local" as const,
      };

      const resolutionResult = await resolveMergeConflicts(
        conflictResult.conflicts,
        mergeContext
      );

      expect(resolutionResult.success).toBe(true);
      expect(resolutionResult.confidence).toBe(1.0);
    });

    it("handles documents with only artboards", async () => {
      const artboardOnlyDoc = {
        schemaVersion: "0.1.0",
        id: "ARTBOARD_ONLY",
        name: "Artboard Only",
        artboards: [
          {
            id: "ARTBOARD_1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      };

      const conflictResult = await detectConflicts({
        base: artboardOnlyDoc,
        local: artboardOnlyDoc,
        remote: artboardOnlyDoc,
      });

      expect(conflictResult.conflicts).toHaveLength(0);
    });

    it("handles deeply nested structures", async () => {
      const deepDoc = createDeepNestedDocument();

      const conflictResult = await detectConflicts({
        base: deepDoc,
        local: deepDoc,
        remote: deepDoc,
      });

      expect(conflictResult.conflicts).toHaveLength(0);
    });
  });

  describe("Resolution Strategy Validation", () => {
    it("respects custom resolution strategies", async () => {
      const scenario = MERGE_TEST_SCENARIOS.find(
        (s) => s.name === "single_property_change"
      )!;
      const conflictResult = await detectConflicts({
        base: scenario.base,
        local: scenario.local,
        remote: scenario.remote,
      });

      const mergeContext = {
        base: scenario.base,
        local: scenario.local,
        remote: scenario.remote,
        target: "local" as const,
      };

      // Force manual resolution even for auto-resolvable conflict
      const resolutionResult = await resolveMergeConflicts(
        conflictResult.conflicts,
        mergeContext,
        {
          resolutionStrategies: {
            "P-VISIBILITY": "manual", // Override default strategy
          },
        }
      );

      // Should have unresolved conflict due to forced manual strategy
      expect(resolutionResult.unresolvedConflicts).toHaveLength(1);
      expect(resolutionResult.needsManualReview).toBe(true);
    });

    it("handles confidence thresholds correctly", async () => {
      const scenario = MERGE_TEST_SCENARIOS.find(
        (s) => s.name === "single_property_change"
      )!;
      const conflictResult = await detectConflicts({
        base: scenario.base,
        local: scenario.local,
        remote: scenario.remote,
      });

      const mergeContext = {
        base: scenario.base,
        local: scenario.local,
        remote: scenario.remote,
        target: "local" as const,
      };

      // Set very low confidence threshold
      const resolutionResult = await resolveMergeConflicts(
        conflictResult.conflicts,
        mergeContext,
        {
          maxAutoResolveConfidence: 0.8, // P-VISIBILITY has 0.7 confidence
        }
      );

      // Should not auto-resolve due to low threshold
      expect(resolutionResult.unresolvedConflicts).toHaveLength(1);
      expect(
        resolutionResult.resolutions.filter((r) => r.applied)
      ).toHaveLength(0);
    });
  });

  describe("Diff and Conflict Correlation", () => {
    it("diff operations correlate with detected conflicts", async () => {
      const scenario = MERGE_TEST_SCENARIOS.find(
        (s) => s.name === "conflicting_property_changes"
      )!;
      const conflictResult = await detectConflicts({
        base: scenario.base,
        local: scenario.local,
        remote: scenario.remote,
      });

      const localDiff = await diffDocuments(scenario.base, scenario.local);
      const remoteDiff = await diffDocuments(scenario.base, scenario.remote);

      // Should have diff operations for the conflicting changes
      expect(localDiff.operations.length).toBeGreaterThan(0);
      expect(remoteDiff.operations.length).toBeGreaterThan(0);

      // Conflicts should correspond to diff operations
      expect(conflictResult.conflicts.length).toBe(
        scenario.expectedConflicts.count
      );

      // Each conflict should have corresponding diff operations
      for (const conflict of conflictResult.conflicts) {
        const relevantLocalOps = localDiff.operations.filter(
          (op) => op.nodeId === conflict.id
        );
        const relevantRemoteOps = remoteDiff.operations.filter(
          (op) => op.nodeId === conflict.id
        );

        // At least one branch should have operations for the conflicting node
        expect(
          relevantLocalOps.length + relevantRemoteOps.length
        ).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * Helper function to count total nodes in a document
 */
function countNodes(doc: any): number {
  let count = doc.artboards?.length || 0;

  function countChildren(nodes: any[]): number {
    let total = nodes.length;
    for (const node of nodes) {
      if (node.children && Array.isArray(node.children)) {
        total += countChildren(node.children);
      }
    }
    return total;
  }

  for (const artboard of doc.artboards || []) {
    count += countChildren(artboard.children || []);
  }

  return count;
}

/**
 * Helper function to create a deeply nested document for testing
 */
function createDeepNestedDocument(): any {
  const doc = {
    schemaVersion: "0.1.0",
    id: "DEEP_NESTED",
    name: "Deep Nested",
    artboards: [
      {
        id: "ARTBOARD_1",
        name: "Artboard",
        frame: { x: 0, y: 0, width: 1440, height: 1024 },
        children: [],
      },
    ],
  };

  let currentLevel = doc.artboards[0].children;
  for (let level = 0; level < 5; level++) {
    const node = {
      id: `LEVEL_${level}`,
      type: "frame",
      name: `Level ${level}`,
      visible: true,
      frame: { x: level * 10, y: level * 10, width: 100, height: 100 },
      children: [],
    };
    currentLevel.push(node);
    currentLevel = node.children;
  }

  return doc;
}
