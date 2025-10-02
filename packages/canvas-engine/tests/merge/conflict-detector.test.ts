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
          layout: { gap: 12 },
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
          layout: { gap: 0 },
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

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });
    expect(result.conflicts).toHaveLength(1);
    const conflict = result.conflicts[0];
    expect(conflict.code).toBe("S-DEL-MOD");
    expect(conflict.type).toBe("structural");
    expect(conflict.autoResolvable).toBe(false);
  });

  it("detects S-ADD-ADD when same node added differently", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    const newLocalNode = {
      id: "NODE_NEW",
      type: "text" as const,
      name: "Local Node",
      visible: true,
      frame: { x: 200, y: 200, width: 120, height: 40 },
      text: "local",
    };

    const newRemoteNode = {
      id: "NODE_NEW",
      type: "text" as const,
      name: "Remote Node",
      visible: true,
      frame: { x: 220, y: 210, width: 120, height: 40 },
      text: "remote",
    };

    localDoc.artboards[0].children[0].children.push(newLocalNode);
    remoteDoc.artboards[0].children[0].children.push(newRemoteNode);

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "S-ADD-ADD")
    ).toBe(true);
  });

  it("detects S-ORDER when children reordered differently", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    // Reorder children in local branch: FRAME_2, FRAME_1
    localDoc.artboards[0].children = [
      baseDoc.artboards[0].children[1], // FRAME_2 first
      baseDoc.artboards[0].children[0], // FRAME_1 second
    ];

    // Reorder children in remote branch: FRAME_2, FRAME_1 (same as local, but both differ from base)
    remoteDoc.artboards[0].children = [
      baseDoc.artboards[0].children[1], // FRAME_2 first
      baseDoc.artboards[0].children[0], // FRAME_1 second
    ];

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    // Since both local and remote have the same reordering (both differ from base the same way),
    // this should NOT be detected as a conflict
    expect(
      result.conflicts.some((conflict) => conflict.code === "S-ORDER")
    ).toBe(false);
  });

  it("detects S-ORDER when children reordered in conflicting ways", () => {
    // Create a base document with 3 children for clearer ordering conflicts
    const testBaseDoc: CanvasDocumentType = {
      schemaVersion: "0.1.0",
      id: "TEST_BASE",
      name: "Test Base",
      artboards: [
        {
          id: "ARTBOARD_1",
          name: "Test Artboard",
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

    // Local reordering: B, C, A
    localDoc.artboards[0].children = [
      testBaseDoc.artboards[0].children[1], // B
      testBaseDoc.artboards[0].children[2], // C
      testBaseDoc.artboards[0].children[0], // A
    ];

    // Remote reordering: C, A, B
    remoteDoc.artboards[0].children = [
      testBaseDoc.artboards[0].children[2], // C
      testBaseDoc.artboards[0].children[0], // A
      testBaseDoc.artboards[0].children[1], // B
    ];

    const result = detectConflicts({
      base: testBaseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "S-ORDER")
    ).toBe(true);
    const orderConflict = result.conflicts.find(
      (conflict) => conflict.code === "S-ORDER"
    );
    expect(orderConflict?.severity).toBe("info");
    expect(orderConflict?.autoResolvable).toBe(true);
  });
});

describe("detectConflicts - property", () => {
  it("detects P-GEOMETRY when frame geometry diverges", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    // Move frame differently in each branch
    localDoc.artboards[0].children[0].frame = {
      x: 10,
      y: 10,
      width: 600,
      height: 600,
    };
    remoteDoc.artboards[0].children[0].frame = {
      x: 20,
      y: 15,
      width: 580,
      height: 590,
    };

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "P-GEOMETRY")
    ).toBe(true);
  });

  it("detects P-VISIBILITY when visibility toggled differently", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    localDoc.artboards[0].children[0].visible = false;
    remoteDoc.artboards[0].children[0].visible = true;

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "P-VISIBILITY")
    ).toBe(true);
  });

  it("detects P-LAYOUT when layout gap diverges", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    localDoc.artboards[0].children[0].layout = { gap: 8 };
    remoteDoc.artboards[0].children[0].layout = { gap: 16 };

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "P-LAYOUT")
    ).toBe(true);
  });

  it("detects P-STYLE when style properties diverge", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    // Add fills to base frame
    baseDoc.artboards[0].children[0].fills = [
      { type: "solid", color: "#000000" },
    ];
    localDoc.artboards[0].children[0].fills = [
      { type: "solid", color: "#FF0000" },
    ];
    remoteDoc.artboards[0].children[0].fills = [
      { type: "solid", color: "#00FF00" },
    ];

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "P-STYLE")
    ).toBe(true);
    const styleConflict = result.conflicts.find(
      (conflict) => conflict.code === "P-STYLE"
    );
    expect(styleConflict?.severity).toBe("info");
    expect(styleConflict?.autoResolvable).toBe(false);
  });
});

describe("detectConflicts - content", () => {
  it("detects C-TEXT when text content diverges", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    // Change text content in each branch
    localDoc.artboards[0].children[0].children[0].text = "Local Text";
    remoteDoc.artboards[0].children[0].children[0].text = "Remote Text";

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "C-TEXT")
    ).toBe(true);
  });

  it("detects C-COMPONENT-PROPS when component props diverge", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    // Add component instances to the base document
    const baseComponent = {
      id: "COMPONENT_1",
      type: "component" as const,
      name: "Test Component",
      visible: true,
      frame: { x: 200, y: 200, width: 100, height: 50 },
      componentKey: "Button",
      props: { variant: "primary", size: "medium" },
    };

    baseDoc.artboards[0].children.push(baseComponent);
    localDoc.artboards[0].children.push({
      ...baseComponent,
      props: { variant: "secondary", size: "medium" }, // Local changes variant
    });
    remoteDoc.artboards[0].children.push({
      ...baseComponent,
      props: { variant: "primary", size: "large" }, // Remote changes size
    });

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "C-COMPONENT-PROPS")
    ).toBe(true);
    const componentConflict = result.conflicts.find(
      (conflict) => conflict.code === "C-COMPONENT-PROPS"
    );
    expect(componentConflict?.severity).toBe("warning");
    expect(componentConflict?.autoResolvable).toBe(false);
  });
});

describe("detectConflicts - metadata", () => {
  it("detects M-NAME when node names diverge", () => {
    const localDoc = clone(baseDoc) satisfies MergeDocuments["local"];
    const remoteDoc = clone(baseDoc) satisfies MergeDocuments["remote"];

    // Change node names in each branch
    localDoc.artboards[0].children[0].name = "Local Container";
    remoteDoc.artboards[0].children[0].name = "Remote Container";

    const result = detectConflicts({
      base: baseDoc,
      local: localDoc,
      remote: remoteDoc,
    });

    expect(
      result.conflicts.some((conflict) => conflict.code === "M-NAME")
    ).toBe(true);
  });
});
