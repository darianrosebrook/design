/**
 * @fileoverview Comprehensive test scenarios for merge conflict detection and resolution
 * @author @darianrosebrook
 */

import type {
  CanvasDocumentType,
  MergeDocuments,
} from "../../src/merge/types.js";

/**
 * Test scenario definition
 */
export interface MergeTestScenario {
  name: string;
  description: string;
  base: CanvasDocumentType;
  local: CanvasDocumentType;
  remote: CanvasDocumentType;
  expectedConflicts: {
    codes: string[];
    count: number;
    autoResolvable: number;
    manualRequired: number;
  };
  tags: string[];
}

/**
 * Clone utility for test scenarios
 */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Base test document template
 */
const createBaseDocument = (id: string, name: string): CanvasDocumentType => ({
  schemaVersion: "0.1.0",
  id,
  name,
  artboards: [
    {
      id: `${id}_ARTBOARD`,
      name: "Main Artboard",
      frame: { x: 0, y: 0, width: 1440, height: 1024 },
      children: [
        {
          id: `${id}_FRAME_A`,
          type: "frame",
          name: "Frame A",
          visible: true,
          frame: { x: 100, y: 100, width: 300, height: 200 },
          children: [
            {
              id: `${id}_TEXT_1`,
              type: "text",
              name: "Title",
              visible: true,
              frame: { x: 20, y: 20, width: 200, height: 40 },
              text: "Sample Text",
            },
          ],
        },
        {
          id: `${id}_FRAME_B`,
          type: "frame",
          name: "Frame B",
          visible: true,
          frame: { x: 450, y: 100, width: 300, height: 200 },
          children: [],
        },
      ],
    },
  ],
});

/**
 * Comprehensive test scenarios covering various merge situations
 */
export const MERGE_TEST_SCENARIOS: MergeTestScenario[] = [
  {
    name: "identical_documents",
    description: "No conflicts when documents are identical",
    base: createBaseDocument("TEST", "Base Document"),
    local: createBaseDocument("TEST", "Local Document"),
    remote: createBaseDocument("TEST", "Remote Document"),
    expectedConflicts: {
      codes: [],
      count: 0,
      autoResolvable: 0,
      manualRequired: 0,
    },
    tags: ["baseline", "no-conflicts"],
  },

  {
    name: "single_property_change",
    description: "Single property change that should auto-resolve",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children[0].visible = false;
      return doc;
    })(),
    remote: createBaseDocument("TEST", "Remote Document"),
    expectedConflicts: {
      codes: ["P-VISIBILITY"],
      count: 1,
      autoResolvable: 1,
      manualRequired: 0,
    },
    tags: ["property", "auto-resolvable", "single-change"],
  },

  {
    name: "conflicting_property_changes",
    description: "Conflicting property changes that require manual resolution",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children[0].frame = {
        x: 150,
        y: 150,
        width: 350,
        height: 250,
      };
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children[0].frame = {
        x: 200,
        y: 200,
        width: 400,
        height: 300,
      };
      return doc;
    })(),
    expectedConflicts: {
      codes: ["P-GEOMETRY"],
      count: 1,
      autoResolvable: 0,
      manualRequired: 1,
    },
    tags: ["property", "geometry", "manual-required", "conflicting"],
  },

  {
    name: "child_reordering_conflict",
    description: "Children reordered differently in local and remote",
    base: (() => {
      const doc = createBaseDocument("TEST", "Base Document");
      // Add third child to base
      doc.artboards[0].children.push({
        id: "TEST_FRAME_C",
        type: "frame",
        name: "Frame C",
        visible: true,
        frame: { x: 800, y: 100, width: 300, height: 200 },
        children: [],
      });
      return doc;
    })(),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children.push({
        id: "TEST_FRAME_C",
        type: "frame",
        name: "Frame C",
        visible: true,
        frame: { x: 800, y: 100, width: 300, height: 200 },
        children: [],
      });
      // Reorder: C, A, B
      doc.artboards[0].children = [
        doc.artboards[0].children[2], // C
        doc.artboards[0].children[0], // A
        doc.artboards[0].children[1], // B
      ];
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children.push({
        id: "TEST_FRAME_C",
        type: "frame",
        name: "Frame C",
        visible: true,
        frame: { x: 800, y: 100, width: 300, height: 200 },
        children: [],
      });
      // Reorder: B, C, A
      doc.artboards[0].children = [
        doc.artboards[0].children[1], // B
        doc.artboards[0].children[2], // C
        doc.artboards[0].children[0], // A
      ];
      return doc;
    })(),
    expectedConflicts: {
      codes: ["S-ORDER"],
      count: 1,
      autoResolvable: 1,
      manualRequired: 0,
    },
    tags: ["structural", "ordering", "auto-resolvable", "three-children"],
  },

  {
    name: "text_content_conflict",
    description: "Text content changed differently in local and remote",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children[0].children[0].text = "Local Text Change";
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children[0].children[0].text = "Remote Text Change";
      return doc;
    })(),
    expectedConflicts: {
      codes: ["C-TEXT"],
      count: 1,
      autoResolvable: 0,
      manualRequired: 1,
    },
    tags: ["content", "text", "manual-required", "conflicting"],
  },

  {
    name: "node_name_conflict",
    description: "Node names changed differently (auto-resolvable)",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children[0].name = "Local Frame Name";
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children[0].name = "Remote Frame Name";
      return doc;
    })(),
    expectedConflicts: {
      codes: ["M-NAME"],
      count: 1,
      autoResolvable: 1,
      manualRequired: 0,
    },
    tags: ["metadata", "name", "auto-resolvable", "prefer-remote"],
  },

  {
    name: "delete_vs_modify_conflict",
    description: "Node deleted locally but modified remotely",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      // Remove FRAME_A
      doc.artboards[0].children = [doc.artboards[0].children[1]];
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      // Modify FRAME_A
      doc.artboards[0].children[0].frame = {
        x: 150,
        y: 150,
        width: 350,
        height: 250,
      };
      return doc;
    })(),
    expectedConflicts: {
      codes: ["S-DEL-MOD"],
      count: 2, // FRAME_A deletion + TEXT_1 child conflict
      autoResolvable: 0,
      manualRequired: 2,
    },
    tags: ["structural", "delete-modify", "manual-required", "destructive"],
  },

  {
    name: "concurrent_additions",
    description: "Same node added with different properties in both branches",
    base: (() => {
      const doc = createBaseDocument("TEST", "Base Document");
      // Remove one child from base to create space for additions
      doc.artboards[0].children = [doc.artboards[0].children[0]];
      return doc;
    })(),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children = [doc.artboards[0].children[0]];
      // Add new node
      doc.artboards[0].children.push({
        id: "NEW_FRAME",
        type: "frame",
        name: "Local New Frame",
        visible: true,
        frame: { x: 450, y: 100, width: 300, height: 200 },
        children: [],
      });
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children = [doc.artboards[0].children[0]];
      // Add same ID but different properties
      doc.artboards[0].children.push({
        id: "NEW_FRAME",
        type: "frame",
        name: "Remote New Frame",
        visible: false,
        frame: { x: 500, y: 150, width: 250, height: 150 },
        children: [],
      });
      return doc;
    })(),
    expectedConflicts: {
      codes: ["S-ADD-ADD"],
      count: 3, // S-ADD-ADD + property conflicts on the added node
      autoResolvable: 2, // Some property conflicts are auto-resolvable
      manualRequired: 1,
    },
    tags: ["structural", "add-add", "manual-required", "concurrent"],
  },

  {
    name: "layout_conflict",
    description: "Layout properties changed differently",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children[0].layout = { gap: 16, direction: "vertical" };
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children[0].layout = {
        gap: 24,
        direction: "horizontal",
      };
      return doc;
    })(),
    expectedConflicts: {
      codes: ["P-LAYOUT"],
      count: 1,
      autoResolvable: 0,
      manualRequired: 1,
    },
    tags: ["property", "layout", "manual-required", "conflicting"],
  },

  {
    name: "style_conflict",
    description: "Style properties (fills) changed differently",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children[0].fills = [
        { type: "solid", color: "#FF0000" },
      ];
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children[0].fills = [
        { type: "solid", color: "#00FF00" },
      ];
      return doc;
    })(),
    expectedConflicts: {
      codes: ["P-STYLE"],
      count: 1,
      autoResolvable: 0,
      manualRequired: 1,
    },
    tags: ["property", "style", "fills", "manual-required", "visual"],
  },

  {
    name: "component_props_conflict",
    description: "Component instance properties changed differently",
    base: (() => {
      const doc = createBaseDocument("TEST", "Base Document");
      // Replace text node with component
      doc.artboards[0].children[0].children[0] = {
        id: "TEST_COMPONENT",
        type: "component",
        name: "Button Component",
        visible: true,
        frame: { x: 20, y: 20, width: 120, height: 40 },
        componentKey: "Button",
        props: { variant: "primary", size: "medium" },
      };
      return doc;
    })(),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children[0].children[0] = {
        id: "TEST_COMPONENT",
        type: "component",
        name: "Button Component",
        visible: true,
        frame: { x: 20, y: 20, width: 120, height: 40 },
        componentKey: "Button",
        props: { variant: "secondary", size: "medium" }, // Changed variant
      };
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children[0].children[0] = {
        id: "TEST_COMPONENT",
        type: "component",
        name: "Button Component",
        visible: true,
        frame: { x: 20, y: 20, width: 120, height: 40 },
        componentKey: "Button",
        props: { variant: "primary", size: "large" }, // Changed size
      };
      return doc;
    })(),
    expectedConflicts: {
      codes: ["C-COMPONENT-PROPS"],
      count: 1,
      autoResolvable: 0,
      manualRequired: 1,
    },
    tags: ["content", "component", "props", "manual-required", "behavior"],
  },

  {
    name: "multiple_conflicts_same_node",
    description: "Multiple conflicts affecting the same node",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      const frame = doc.artboards[0].children[0];
      frame.name = "Local Name";
      frame.visible = false;
      frame.frame = { x: 150, y: 150, width: 350, height: 250 };
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      const frame = doc.artboards[0].children[0];
      frame.name = "Remote Name";
      frame.visible = true;
      frame.frame = { x: 200, y: 200, width: 400, height: 300 };
      return doc;
    })(),
    expectedConflicts: {
      codes: ["M-NAME", "P-VISIBILITY", "P-GEOMETRY"],
      count: 3,
      autoResolvable: 2, // M-NAME and P-VISIBILITY
      manualRequired: 1, // P-GEOMETRY
    },
    tags: ["multiple", "same-node", "mixed-resolution", "complex"],
  },

  {
    name: "nested_child_conflicts",
    description: "Conflicts in deeply nested child elements",
    base: (() => {
      const doc = createBaseDocument("TEST", "Base Document");
      // Add nested structure
      doc.artboards[0].children[0].children.push({
        id: "TEST_INNER_FRAME",
        type: "frame",
        name: "Inner Frame",
        visible: true,
        frame: { x: 50, y: 80, width: 200, height: 100 },
        children: [
          {
            id: "TEST_INNER_TEXT",
            type: "text",
            name: "Inner Text",
            visible: true,
            frame: { x: 10, y: 10, width: 150, height: 30 },
            text: "Inner content",
          },
        ],
      });
      return doc;
    })(),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].children[0].children.push({
        id: "TEST_INNER_FRAME",
        type: "frame",
        name: "Inner Frame",
        visible: true,
        frame: { x: 50, y: 80, width: 200, height: 100 },
        children: [
          {
            id: "TEST_INNER_TEXT",
            type: "text",
            name: "Inner Text",
            visible: true,
            frame: { x: 10, y: 10, width: 150, height: 30 },
            text: "Local inner content",
          },
        ],
      });
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].children[0].children.push({
        id: "TEST_INNER_FRAME",
        type: "frame",
        name: "Inner Frame",
        visible: true,
        frame: { x: 50, y: 80, width: 200, height: 100 },
        children: [
          {
            id: "TEST_INNER_TEXT",
            type: "text",
            name: "Inner Text",
            visible: true,
            frame: { x: 10, y: 10, width: 150, height: 30 },
            text: "Remote inner content",
          },
        ],
      });
      return doc;
    })(),
    expectedConflicts: {
      codes: ["C-TEXT"],
      count: 1,
      autoResolvable: 0,
      manualRequired: 1,
    },
    tags: ["nested", "deep", "content", "manual-required"],
  },

  {
    name: "artboard_level_conflicts",
    description: "Conflicts at the artboard level",
    base: createBaseDocument("TEST", "Base Document"),
    local: (() => {
      const doc = createBaseDocument("TEST", "Local Document");
      doc.artboards[0].frame = { x: 0, y: 0, width: 1600, height: 1200 };
      doc.artboards[0].name = "Local Artboard";
      return doc;
    })(),
    remote: (() => {
      const doc = createBaseDocument("TEST", "Remote Document");
      doc.artboards[0].frame = { x: 0, y: 0, width: 1200, height: 800 };
      doc.artboards[0].name = "Remote Artboard";
      return doc;
    })(),
    expectedConflicts: {
      codes: ["P-GEOMETRY", "M-NAME"],
      count: 2,
      autoResolvable: 1, // M-NAME
      manualRequired: 1, // P-GEOMETRY (artboard size)
    },
    tags: ["artboard", "root-level", "mixed-resolution", "dimensions"],
  },

  {
    name: "large_document_performance",
    description: "Performance test with many nodes (50+)",
    base: (() => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "BASE_15",
        name: "Large Document",
        artboards: [
          {
            id: "ARTBOARD_LARGE",
            name: "Large Artboard",
            frame: { x: 0, y: 0, width: 2000, height: 1500 },
            children: [],
          },
        ],
      };

      // Add 50 frames
      for (let i = 0; i < 50; i++) {
        doc.artboards[0].children.push({
          id: `FRAME_${i}`,
          type: "frame",
          name: `Frame ${i}`,
          visible: true,
          frame: {
            x: (i % 10) * 150,
            y: Math.floor(i / 10) * 120,
            width: 120,
            height: 100,
          },
          children: [],
        });
      }
      return doc;
    })(),
    local: (() => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "LOCAL_15",
        name: "Large Document",
        artboards: [
          {
            id: "ARTBOARD_LARGE",
            name: "Large Artboard",
            frame: { x: 0, y: 0, width: 2000, height: 1500 },
            children: [],
          },
        ],
      };

      // Add 50 frames with some modifications
      for (let i = 0; i < 50; i++) {
        doc.artboards[0].children.push({
          id: `FRAME_${i}`,
          type: "frame",
          name: `Frame ${i}`,
          visible: i % 3 === 0 ? false : true, // Every 3rd frame hidden
          frame: {
            x: (i % 10) * 150,
            y: Math.floor(i / 10) * 120,
            width: 120,
            height: 100,
          },
          children: [],
        });
      }
      return doc;
    })(),
    remote: (() => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "REMOTE_15",
        name: "Large Document",
        artboards: [
          {
            id: "ARTBOARD_LARGE",
            name: "Large Artboard",
            frame: { x: 0, y: 0, width: 2000, height: 1500 },
            children: [],
          },
        ],
      };

      // Add 50 frames with different modifications
      for (let i = 0; i < 50; i++) {
        doc.artboards[0].children.push({
          id: `FRAME_${i}`,
          type: "frame",
          name: `Frame ${i}`,
          visible: i % 4 === 0 ? false : true, // Different visibility pattern
          frame: {
            x: (i % 10) * 150,
            y: Math.floor(i / 10) * 120,
            width: 120,
            height: 100,
          },
          children: [],
        });
      }
      return doc;
    })(),
    expectedConflicts: {
      codes: ["P-VISIBILITY"],
      count: 20, // Frames where visibility differs
      autoResolvable: 20,
      manualRequired: 0,
    },
    tags: ["performance", "large-document", "many-nodes", "auto-resolvable"],
  },
];

/**
 * Get scenarios by tags
 */
export function getScenariosByTags(tags: string[]): MergeTestScenario[] {
  return MERGE_TEST_SCENARIOS.filter((scenario) =>
    tags.some((tag) => scenario.tags.includes(tag))
  );
}

/**
 * Get scenarios that should have conflicts
 */
export function getConflictScenarios(): MergeTestScenario[] {
  return MERGE_TEST_SCENARIOS.filter(
    (scenario) => scenario.expectedConflicts.count > 0
  );
}

/**
 * Get scenarios that should be auto-resolvable
 */
export function getAutoResolvableScenarios(): MergeTestScenario[] {
  return MERGE_TEST_SCENARIOS.filter(
    (scenario) => scenario.expectedConflicts.autoResolvable > 0
  );
}

/**
 * Get complex multi-conflict scenarios
 */
export function getComplexScenarios(): MergeTestScenario[] {
  return MERGE_TEST_SCENARIOS.filter(
    (scenario) =>
      scenario.expectedConflicts.count > 1 ||
      scenario.tags.includes("multiple") ||
      scenario.tags.includes("complex")
  );
}
