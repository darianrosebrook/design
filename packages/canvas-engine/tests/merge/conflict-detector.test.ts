/**
 * @fileoverview Tests for merge conflict detection (structural conflicts)
 * author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import { detectConflicts } from "../../src/merge/conflict-detector.js";
import type { MergeDocuments } from "../../src/merge/types.js";

const baseDoc = {
  schemaVersion: "0.1.0",
  id: "BASE_DOC",
  name: "Base",
  artboards: [
    {
      id: "ARTBOARD_1",
      name: "Artboard 1",
      frame: { x: 0, y: 0, width: 1440, height: 1024 },
      children: [
        {
          id: "FRAME_PRIMARY",
          type: "frame",
          name: "Primary Container",
          visible: true,
          frame: { x: 0, y: 0, width: 600, height: 600 },
          children: [
            {
              id: "NODE_TEXT",
              type: "text",
              name: "Title",
              visible: true,
              frame: { x: 10, y: 10, width: 200, height: 40 },
              text: "Hello",
            },
            {
              id: "NODE_CHILD",
              type: "frame",
              name: "Nested",
              visible: true,
              frame: { x: 50, y: 120, width: 200, height: 200 },
              children: [],
            },
          ],
        },
        {
          id: "FRAME_SECONDARY",
          type: "frame",
          name: "Secondary Container",
          visible: true,
          frame: { x: 800, y: 0, width: 400, height: 400 },
          children: [],
        },
      ],
    },
  ],
} satisfies MergeDocuments["base"];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const baseDocs = {
  base: baseDoc,
  local: baseDoc,
  remote: baseDoc,
} satisfies MergeDocuments;

describe("detectConflicts - structural", () => {
  it("returns no conflicts when documents are identical", () => {
    const result = detectConflicts(baseDocs);
    expect(result.conflicts).toHaveLength(0);
  });

  it("detects S-DEL-MOD when node deleted locally and modified remotely", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    localDoc.artboards[0].children[0].children = [
      localDoc.artboards[0].children[0].children[1],
    ];

    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];
    remoteDoc.artboards[0].children[0].children[0].text = "Hello Remote";

    const result = detectConflicts({ base: baseDoc, local: localDoc, remote: remoteDoc });
    expect(result.conflicts).toHaveLength(1);
    const conflict = result.conflicts[0];
    expect(conflict.code).toBe("S-DEL-MOD");
    expect(conflict.type).toBe("structural");
    expect(conflict.autoResolvable).toBe(false);
  });

  it("detects S-MOVE-MOVE when node moved to different parents", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    // Local: move NODE_CHILD under FRAME_SECONDARY (F2)
    {
      const [primaryFrame, secondaryFrame] = localDoc.artboards[0].children;
      if (primaryFrame.type === "frame" && secondaryFrame.type === "frame") {
        const [textNode, nestedFrame] = primaryFrame.children;
        if (nestedFrame.type === "frame") {
          primaryFrame.children = [textNode];
          secondaryFrame.children = [nestedFrame];
        }
      }
    }

    // Remote: create FRAME_TERTIARY and move NODE_CHILD there
    {
      const artboard = remoteDoc.artboards[0];
      const [primaryFrame, secondaryFrame] = artboard.children;
      const tertiaryFrame = {
        id: "FRAME_TERTIARY",
        type: "frame",
        name: "Tertiary Container",
        visible: true,
        frame: { x: 0, y: 300, width: 300, height: 200 },
        children: [] as unknown[],
      };
      if (primaryFrame.type === "frame") {
        const [textNode, nestedFrame] = primaryFrame.children;
        if (nestedFrame.type === "frame") {
          primaryFrame.children = [textNode];
          tertiaryFrame.children = [nestedFrame];
        }
      }
      artboard.children = [primaryFrame, secondaryFrame, tertiaryFrame];
    }

    const result = detectConflicts({ base: baseDoc, local: localDoc, remote: remoteDoc });
    expect(result.conflicts.some((conflict) => conflict.code === "S-MOVE-MOVE")).toBe(true);
  });

  // TODO: Add S-ORDER detection once move/order heuristics settle
});

