/**
 * @fileoverview Tests for debug overlay functionality
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CanvasDebugOverlay } from "../src/debug-overlay.js";

// Mock DOM elements
const mockElement = {
  style: {},
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  setAttribute: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    top: 0,
    left: 0,
    width: 800,
    height: 600,
  })),
  parentNode: {
    removeChild: vi.fn(),
  },
  firstChild: null,
};

// Mock document
Object.defineProperty(global, "document", {
  writable: true,
  value: {
    createElement: vi.fn(() => mockElement),
  },
});

// Mock window
Object.defineProperty(global, "window", {
  writable: true,
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

describe("CanvasDebugOverlay", () => {
  let overlay: CanvasDebugOverlay;
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock element
    mockElement.style = {};
    mockElement.firstChild = null;

    overlay = new CanvasDebugOverlay();
    container = mockElement as any;
  });

  describe("initialization", () => {
    it("should create overlay with default config", () => {
      const config = overlay.getConfig();
      expect(config.visible).toBe(false);
      expect(config.enabledModes).toEqual([]);
      expect(config.zIndex).toBe(9999);
      expect(config.opacity).toBe(0.8);
    });

    it("should create overlay with custom config", () => {
      const customOverlay = new CanvasDebugOverlay({
        visible: true,
        enabledModes: ["bounds"],
        zIndex: 1000,
      });

      const config = customOverlay.getConfig();
      expect(config.visible).toBe(true);
      expect(config.enabledModes).toEqual(["bounds"]);
      expect(config.zIndex).toBe(1000);
    });
  });

  describe("configuration", () => {
    it("should update configuration", () => {
      overlay.updateConfig({ visible: true, opacity: 0.5 });
      const config = overlay.getConfig();
      expect(config.visible).toBe(true);
      expect(config.opacity).toBe(0.5);
    });

    it("should enable debug mode", () => {
      overlay.setModeEnabled("bounds", true);
      const config = overlay.getConfig();
      expect(config.enabledModes).toContain("bounds");
    });

    it("should disable debug mode", () => {
      overlay.setModeEnabled("bounds", true);
      overlay.setModeEnabled("bounds", false);
      const config = overlay.getConfig();
      expect(config.enabledModes).not.toContain("bounds");
    });

    it("should set visibility", () => {
      overlay.setVisible(true);
      expect(overlay.getConfig().visible).toBe(true);

      overlay.setVisible(false);
      expect(overlay.getConfig().visible).toBe(false);
    });
  });

  describe("rendering", () => {
    it("should render overlay when visible", () => {
      overlay.setVisible(true);
      overlay.setModeEnabled("bounds", true);

      overlay.render({} as any, container);

      expect(document.createElement).toHaveBeenCalledWith("div");
      expect(container.appendChild).toHaveBeenCalled();
    });

    it("should not render when not visible", () => {
      overlay.setVisible(false);
      overlay.setModeEnabled("bounds", true);

      overlay.render({} as any, container);

      // Should not create overlay element when not visible
      expect(document.createElement).not.toHaveBeenCalled();
    });

    it("should clear overlay when no modes enabled", () => {
      overlay.setVisible(true);
      overlay.setModeEnabled("bounds", false);

      overlay.render({} as any, container);

      // Should not create overlay element when no modes enabled
      expect(document.createElement).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should destroy overlay", () => {
      overlay.setVisible(true);
      overlay.setModeEnabled("bounds", true);
      overlay.render({} as any, container);

      overlay.destroy();

      expect(mockElement.parentNode.removeChild).toHaveBeenCalledWith(
        mockElement
      );
    });

    it("should handle multiple destroy calls", () => {
      overlay.setVisible(true);
      overlay.setModeEnabled("bounds", true);
      overlay.render({} as any, container);

      overlay.destroy();
      overlay.destroy(); // Should not throw

      expect(mockElement.parentNode.removeChild).toHaveBeenCalledTimes(1);
    });
  });
});
