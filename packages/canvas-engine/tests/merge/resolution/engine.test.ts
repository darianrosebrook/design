/**
 * @fileoverview Tests for merge resolution engine
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  MergeResolutionEngine,
  resolveMergeConflicts,
  canAutoResolve,
  ResolutionStrategy,
} from "../../../src/merge/resolution/index.js";
import { detectConflicts } from "../../../src/merge/conflict-detector.js";
import type {
  CanvasDocumentType,
  MergeDocuments,
} from "../../../src/merge/types.js";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const baseDoc: CanvasDocumentType = {
  schemaVersion: "0.1.0",
  id: "BASE_DOC",
  name: "Base Document",
  artboards: [
    {
      id: "ARTBOARD_1",
      name: "Main Artboard",
      frame: { x: 0, y: 0, width: 1440, height: 1024 },
      children: [
        {
          id: "FRAME_1",
          type: "frame",
          name: "Container",
          visible: true,
          frame: { x: 100, y: 100, width: 400, height: 300 },
          children: [
            {
              id: "TEXT_1",
              type: "text",
              name: "Title",
              visible: true,
              frame: { x: 20, y: 20, width: 200, height: 40 },
              text: "Hello World",
            },
          ],
        },
        {
          id: "FRAME_2",
          type: "frame",
          name: "Secondary",
          visible: true,
          frame: { x: 600, y: 100, width: 300, height: 200 },
          children: [],
        },
      ],
    },
  ],
};

describe("MergeResolutionEngine", () => {
  describe("resolveConflicts", () => {
    it("resolves no conflicts when there are none", async () => {
      const conflicts = await detectConflicts({
        base: baseDoc,
        local: baseDoc,
        remote: baseDoc,
      });

      const context = {
        base: baseDoc,
        local: baseDoc,
        remote: baseDoc,
        target: "local" as const,
      };

      const engine = new MergeResolutionEngine();
      const result = await engine.resolveConflicts(
        conflicts.conflicts,
        context
      );

      expect(result.success).toBe(true);
      expect(result.unresolvedConflicts).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
      expect(result.needsManualReview).toBe(false);
    });

    it("auto-resolves S-ORDER conflicts with prefer-local strategy", async () => {
      // Create documents with ordering conflicts
      const localDoc = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              baseDoc.artboards[0].children[1], // FRAME_2 first
              baseDoc.artboards[0].children[0], // FRAME_1 second
            ],
          },
        ],
      };

      const remoteDoc = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              baseDoc.artboards[0].children[0], // FRAME_1 first
              baseDoc.artboards[0].children[1], // FRAME_2 second
            ],
          },
        ],
      };

      // Add a third child to make ordering conflicts clearer
      const extraChild = {
        id: "FRAME_3",
        type: "frame" as const,
        name: "Extra Frame",
        visible: true,
        frame: { x: 700, y: 100, width: 200, height: 150 },
        children: [],
      };

      baseDoc.artboards[0].children.push(extraChild);
      localDoc.artboards[0].children.push(extraChild);
      remoteDoc.artboards[0].children.push(extraChild);

      // Reorder to create conflict
      localDoc.artboards[0].children = [
        extraChild,
        baseDoc.artboards[0].children[0],
        baseDoc.artboards[0].children[1],
      ];

      remoteDoc.artboards[0].children = [
        baseDoc.artboards[0].children[1],
        extraChild,
        baseDoc.artboards[0].children[0],
      ];

      const conflicts = await detectConflicts({
        base: baseDoc,
        local: localDoc,
        remote: remoteDoc,
      });

      const context = {
        base: baseDoc,
        local: localDoc,
        remote: remoteDoc,
        target: "local" as const,
      };

      const engine = new MergeResolutionEngine();
      const result = await engine.resolveConflicts(
        conflicts.conflicts,
        context
      );

      expect(result.success).toBe(true);
      expect(result.unresolvedConflicts).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.needsManualReview).toBe(false);
    });

    it("marks destructive conflicts for manual review", async () => {
      const localDoc = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [baseDoc.artboards[0].children[1]], // Remove FRAME_1
          },
        ],
      };

      const remoteDoc = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                name: "Modified Name", // Modify FRAME_1
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      const conflicts = await detectConflicts({
        base: baseDoc,
        local: localDoc,
        remote: remoteDoc,
      });

      const context = {
        base: baseDoc,
        local: localDoc,
        remote: remoteDoc,
        target: "local" as const,
      };

      const engine = new MergeResolutionEngine();
      const result = await engine.resolveConflicts(
        conflicts.conflicts,
        context
      );

      // There are 2 S-DEL-MOD conflicts: one for FRAME_1 and one for its child TEXT_1
      expect(result.success).toBe(true); // failOnUnresolved defaults to false, so success even with unresolved conflicts
      expect(result.unresolvedConflicts).toHaveLength(2);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.needsManualReview).toBe(true);
    });

    it("respects custom resolution strategies", async () => {
      // Create isolated test documents with 3 children for ordering conflicts
      const testBaseDoc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "TEST_BASE_STRATEGY",
        name: "Test Base Strategy",
        artboards: [
          {
            id: "ARTBOARD_STRATEGY",
            name: "Test Artboard Strategy",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "CHILD_A",
                type: "frame",
                name: "Child A",
                visible: true,
                frame: { x: 100, y: 100, width: 200, height: 100 },
                children: [],
              },
              {
                id: "CHILD_B",
                type: "frame",
                name: "Child B",
                visible: true,
                frame: { x: 320, y: 100, width: 200, height: 100 },
                children: [],
              },
              {
                id: "CHILD_C",
                type: "frame",
                name: "Child C",
                visible: true,
                frame: { x: 540, y: 100, width: 200, height: 100 },
                children: [],
              },
            ],
          },
        ],
      };

      const localDoc = clone(testBaseDoc) satisfies MergeDocuments["local"];
      const remoteDoc = clone(testBaseDoc) satisfies MergeDocuments["remote"];

      // Local ordering: C, A, B
      localDoc.artboards[0].children = [
        testBaseDoc.artboards[0].children[2], // CHILD_C
        testBaseDoc.artboards[0].children[0], // CHILD_A
        testBaseDoc.artboards[0].children[1], // CHILD_B
      ];

      // Remote ordering: B, C, A
      remoteDoc.artboards[0].children = [
        testBaseDoc.artboards[0].children[1], // CHILD_B
        testBaseDoc.artboards[0].children[2], // CHILD_C
        testBaseDoc.artboards[0].children[0], // CHILD_A
      ];

      const conflicts = await detectConflicts({
        base: testBaseDoc,
        local: localDoc,
        remote: remoteDoc,
      });

      const context = {
        base: testBaseDoc,
        local: localDoc,
        remote: remoteDoc,
        target: "local" as const,
      };

      // Override strategy to prefer remote instead of local
      const engine = new MergeResolutionEngine({
        resolutionStrategies: {
          "S-ORDER": ResolutionStrategy.PREFER_REMOTE,
        },
      });

      const result = await engine.resolveConflicts(
        conflicts.conflicts,
        context
      );

      expect(result.success).toBe(true);
      expect(result.unresolvedConflicts).toHaveLength(0);
      // The resolved document should have remote's ordering applied: B, C, A
      expect(result.resolvedDocument.artboards[0].children[0].id).toBe(
        "CHILD_B"
      );
      expect(result.resolvedDocument.artboards[0].children[1].id).toBe(
        "CHILD_C"
      );
      expect(result.resolvedDocument.artboards[0].children[2].id).toBe(
        "CHILD_A"
      );
    });

    it("respects auto-resolve confidence threshold", async () => {
      const localDoc = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                visible: false, // P-VISIBILITY conflict
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      const remoteDoc = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                visible: true, // Different visibility
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      const conflicts = await detectConflicts({
        base: baseDoc,
        local: localDoc,
        remote: remoteDoc,
      });

      const context = {
        base: baseDoc,
        local: localDoc,
        remote: remoteDoc,
        target: "local" as const,
      };

      // Set very high confidence threshold so auto-resolution doesn't happen
      const engine = new MergeResolutionEngine({
        maxAutoResolveConfidence: 0.9, // P-VISIBILITY has 0.7 confidence
        failOnUnresolved: true, // Force failure when conflicts can't be resolved
      });

      const result = await engine.resolveConflicts(
        conflicts.conflicts,
        context
      );

      expect(result.success).toBe(false);
      expect(result.unresolvedConflicts).toHaveLength(1);
      expect(result.needsManualReview).toBe(true);
    });
  });

  describe("resolveMergeConflicts convenience function", () => {
    it("provides a simple interface for resolution", async () => {
      const conflicts = await detectConflicts({
        base: baseDoc,
        local: baseDoc,
        remote: baseDoc,
      });

      const context = {
        base: baseDoc,
        local: baseDoc,
        remote: baseDoc,
        target: "local" as const,
      };

      const result = await resolveMergeConflicts(conflicts.conflicts, context);

      expect(result.success).toBe(true);
      expect(result.unresolvedConflicts).toHaveLength(0);
    });
  });

  describe("canAutoResolve utility", () => {
    it("returns true for auto-resolvable conflicts", () => {
      const mockConflict = {
        id: "test",
        type: "structural" as const,
        code: "S-ORDER",
        severity: "info" as const,
        path: ["artboards", 0, "children"],
        autoResolvable: true,
        message: "Test conflict",
      };

      expect(canAutoResolve(mockConflict)).toBe(true);
    });

    it("returns false for manual conflicts", () => {
      const mockConflict = {
        id: "test",
        type: "structural" as const,
        code: "S-DEL-MOD",
        severity: "error" as const,
        path: ["artboards", 0, "children", 0],
        autoResolvable: false,
        message: "Test conflict",
      };

      expect(canAutoResolve(mockConflict)).toBe(false);
    });

    it("respects confidence threshold", () => {
      const mockConflict = {
        id: "test",
        type: "property" as const,
        code: "P-VISIBILITY",
        severity: "info" as const,
        path: ["artboards", 0, "children", 0, "visible"],
        autoResolvable: true,
        message: "Test conflict",
      };

      // P-VISIBILITY has 0.7 confidence, so should pass with default threshold
      expect(canAutoResolve(mockConflict)).toBe(true);

      // But not with higher threshold
      expect(
        canAutoResolve(mockConflict, { maxAutoResolveConfidence: 0.8 })
      ).toBe(false);
    });
  });

  describe("MergeResolutionEngine instantiation", () => {
    it("creates engine with default options", () => {
      const engine = new MergeResolutionEngine();
      expect(engine).toBeInstanceOf(MergeResolutionEngine);
    });

    it("creates engine with custom options", () => {
      const engine = new MergeResolutionEngine({
        autoResolve: false,
        maxAutoResolveConfidence: 0.8,
      });
      expect(engine).toBeInstanceOf(MergeResolutionEngine);
    });
  });
});
