/**
 * @fileoverview Properties Panel Tests
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  NodeType,
  FrameNodeType,
  TextNodeType,
} from "@paths-design/canvas-schema";
import {
  PropertiesService,
  PropertyRegistry,
  getNodeProperty,
  setNodeProperty,
  validatePropertyValue,
  formatPropertyValue,
} from "../src/index";

// Mock canvas schema types for testing
const createMockFrameNode = (
  overrides: Partial<FrameNodeType> = {}
): FrameNodeType => ({
  id: "frame-1",
  type: "frame",
  name: "Test Frame",
  visible: true,
  frame: { x: 0, y: 0, width: 100, height: 100 },
  layout: {},
  children: [],
  ...overrides,
});

const createMockTextNode = (
  overrides: Partial<TextNodeType> = {}
): TextNodeType => ({
  id: "text-1",
  type: "text",
  name: "Test Text",
  visible: true,
  frame: { x: 0, y: 0, width: 100, height: 20 },
  text: "Hello World",
  textStyle: {
    family: "Arial",
    size: 16,
    weight: "400",
    color: "#000000",
  },
  ...overrides,
});

describe("Properties Panel", () => {
  beforeEach(() => {
    // Reset the properties service before each test
    PropertiesService.getInstance().reset();
  });

  describe("PropertyRegistry", () => {
    it("should register and retrieve sections", () => {
      const sections = PropertyRegistry.getSections();
      expect(sections.length).toBeGreaterThan(0);
      expect(sections.some((s) => s.id === "layout")).toBe(true);
      expect(sections.some((s) => s.id === "appearance")).toBe(true);
    });

    it("should get sections for specific node types", () => {
      const frameSections = PropertyRegistry.getSectionsForNodeType("frame");
      expect(frameSections.length).toBeGreaterThan(0);

      const textSections = PropertyRegistry.getSectionsForNodeType("text");
      expect(textSections.length).toBeGreaterThan(0);
    });

    it("should get properties for node types", () => {
      const frameProps = PropertyRegistry.getPropertiesForNodeType("frame");
      expect(frameProps.some((p) => p.key === "frame.x")).toBe(true);
      expect(frameProps.some((p) => p.key === "frame.y")).toBe(true);

      const textProps = PropertyRegistry.getPropertiesForNodeType("text");
      expect(textProps.some((p) => p.key === "text.content")).toBe(true);
      expect(textProps.some((p) => p.key === "textStyle.family")).toBe(true);
    });
  });

  describe("Property Utilities", () => {
    it("should get properties from nodes", () => {
      const node = createMockFrameNode({
        frame: { x: 10, y: 20, width: 100, height: 50 },
      });

      expect(getNodeProperty(node, "frame.x")).toBe(10);
      expect(getNodeProperty(node, "frame.y")).toBe(20);
      expect(getNodeProperty(node, "frame.width")).toBe(100);
      expect(getNodeProperty(node, "frame.height")).toBe(50);
    });

    it("should set properties on nodes", () => {
      const node = createMockFrameNode();
      const updated = setNodeProperty(node, "frame.x", 50);

      expect(updated.frame.x).toBe(50);
      expect(updated.frame.y).toBe(0); // unchanged
    });

    it("should validate property values", () => {
      const definition = {
        key: "test",
        label: "Test",
        type: "number" as const,
        category: "test",
        min: 0,
        max: 100,
      };

      expect(validatePropertyValue(50, definition).valid).toBe(true);
      expect(validatePropertyValue(-1, definition).valid).toBe(false);
      expect(validatePropertyValue(150, definition).valid).toBe(false);
    });

    it("should format property values for display", () => {
      const definition = {
        key: "test",
        label: "Test",
        type: "number" as const,
        category: "test",
        precision: 2,
      };

      expect(formatPropertyValue(3.14159, definition)).toBe("3.14");
      expect(
        formatPropertyValue("hello", {
          key: "test",
          label: "Test",
          type: "string" as const,
          category: "test",
        })
      ).toBe("hello");
    });
  });

  describe("PropertiesService", () => {
    it("should manage node state", () => {
      const service = PropertiesService.getInstance();
      const nodes = [
        createMockFrameNode({ id: "frame-1" }),
        createMockTextNode({ id: "text-1" }),
      ];

      service.setNodes(nodes);
      service.setSelection({
        selectedNodeIds: ["frame-1", "text-1"],
        focusedNodeId: "frame-1",
      });
      expect(service.getApplicableProperties()).toHaveLength(2);
    });

    it("should handle selection changes", () => {
      const service = PropertiesService.getInstance();
      const selection = {
        selectedNodeIds: ["frame-1"],
        focusedNodeId: "frame-1",
      };

      service.setSelection(selection);
      expect(service.getSelection().selectedNodeIds).toEqual(["frame-1"]);
    });

    it("should get and set node properties", () => {
      const service = PropertiesService.getInstance();
      const node = createMockFrameNode({
        frame: { x: 10, y: 20, width: 100, height: 100 },
      });

      service.setNodes([node]);

      expect(service.getNodeProperty("frame-1", "frame.x")).toBe(10);
      expect(service.setNodeProperty("frame-1", "frame.x", 50)).toBe(true);
      expect(service.getNodeProperty("frame-1", "frame.x")).toBe(50);
    });

    it("should handle mixed property values", () => {
      const service = PropertiesService.getInstance();
      const node1 = createMockFrameNode({
        id: "frame-1",
        frame: { x: 10, y: 10, width: 100, height: 100 },
      });
      const node2 = createMockFrameNode({
        id: "frame-2",
        frame: { x: 20, y: 20, width: 100, height: 100 },
      });

      service.setNodes([node1, node2]);
      service.setSelection({
        selectedNodeIds: ["frame-1", "frame-2"],
        focusedNodeId: "frame-1",
      });

      const mixedValue = service.getMixedPropertyValue("frame.x");
      expect(mixedValue).toBe("mixed");
    });

    it("should notify property change callbacks", () => {
      const service = PropertiesService.getInstance();
      const node = createMockFrameNode();

      service.setNodes([node]);

      const callback = vi.fn();
      const unsubscribe = service.onPropertyChange(callback);

      service.setNodeProperty("frame-1", "frame.x", 50);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeId: "frame-1",
          propertyKey: "frame.x",
          oldValue: 0,
          newValue: 50,
          sectionId: "layout",
        })
      );

      unsubscribe();
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete property editing workflow", () => {
      const service = PropertiesService.getInstance();
      const node = createMockTextNode({
        text: "Original Text",
        textStyle: { family: "Arial", size: 16 },
      });

      service.setNodes([node]);
      service.setSelection({
        selectedNodeIds: ["text-1"],
        focusedNodeId: "text-1",
      });

      // Change text content
      expect(
        service.setNodeProperty("text-1", "text.content", "New Text")
      ).toBe(true);

      // Change font size
      expect(service.setNodeProperty("text-1", "textStyle.size", 24)).toBe(
        true
      );

      // Verify changes
      expect(service.getNodeProperty("text-1", "text.content")).toBe(
        "New Text"
      );
      expect(service.getNodeProperty("text-1", "textStyle.size")).toBe(24);
    });

    it("should handle property validation errors", () => {
      const service = PropertiesService.getInstance();
      const node = createMockFrameNode();

      service.setNodes([node]);

      // Try to set invalid width (negative)
      expect(service.setNodeProperty("frame-1", "frame.width", -10)).toBe(true);

      // The service should still accept it (validation happens at UI level)
      expect(service.getNodeProperty("frame-1", "frame.width")).toBe(-10);
    });
  });
});
