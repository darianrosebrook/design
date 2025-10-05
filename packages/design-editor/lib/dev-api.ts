/**
 * Development API for canvas interaction via browser console
 * Similar to Figma's global `figma` object
 *
 * Only available in development mode for debugging and testing
 */

import { useCanvas } from "./canvas-context";
import type {
  CanvasObject,
  CanvasTool,
  CanvasBackground,
} from "./canvas-context";

interface DevCanvasAPI {
  // State getters
  getObjects: () => CanvasObject[];
  getSelectedId: () => string | null;
  getSelectedIds: () => Set<string>;
  getActiveTool: () => CanvasTool;
  getZoom: () => number;
  getViewport: () => { x: number; y: number };
  getCursor: () => { x: number; y: number };

  // State setters
  setObjects: (objects: CanvasObject[]) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: Set<string>) => void;
  setActiveTool: (tool: CanvasTool) => void;
  setZoom: (zoom: number) => void;
  setViewport: (x: number, y: number) => void;

  // Utility methods
  selectAll: () => void;
  clearSelection: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomTo100: () => void;

  // Object manipulation
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // Tools
  selectTool: (tool: CanvasTool) => void;
  tools: {
    SELECT: "select";
    HAND: "hand";
    SCALE: "scale";
    FRAME: "frame";
    TEXT: "text";
    IMAGE: "image";
    RECTANGLE: "rectangle";
    ELLIPSE: "ellipse";
    LINE: "line";
    POLYGON: "polygon";
  };

  // Backgrounds
  setBackground: (bg: CanvasBackground) => void;
  backgrounds: {
    SOLID: "solid";
    DOT_GRID: "dot-grid";
    SQUARE_GRID: "square-grid";
  };

  // Development utilities
  logState: () => void;
  createTestObject: (type?: string) => CanvasObject;

  // Future API surface (for integration planning)
  // Document management
  getDocument?: () => any; // CanvasDocumentType
  saveDocument?: () => Promise<void>;
  loadDocument?: (id: string) => Promise<void>;
  createDocument?: (name: string) => Promise<void>;

  // Node operations (future)
  createNode?: (parentPath: any, nodeData: any) => Promise<void>;
  updateNode?: (nodeId: string, updates: any) => Promise<void>;
  deleteNode?: (nodeId: string) => Promise<void>;
  moveNode?: (nodeId: string, newParentPath: any) => Promise<void>;

  // Advanced operations (future)
  findNode?: (nodeId: string) => any;
  getNodeAtPoint?: (x: number, y: number) => string | null;

  // Undo/Redo (future)
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;

  // Components (future)
  getComponents?: () => any[];
  createComponentInstance?: (
    componentId: string,
    position: any
  ) => Promise<void>;
}

// Global flag to track if API has been exposed (survives re-renders)
let hasExposedAPI = false;

/**
 * Hook to expose canvas API to window object in development mode
 */
export function useDevAPI() {
  const canvas = useCanvas();

  // Only expose in development mode and on client side
  const isDevelopment = process.env.NODE_ENV === "development";
  const isClient = typeof window !== "undefined";

  if (!isDevelopment || !isClient) {
    return null;
  }

  const devAPI: DevCanvasAPI = {
    // State getters
    getObjects: () => canvas.objects,
    getSelectedId: () => canvas.selectedId,
    getSelectedIds: () => canvas.selectedIds,
    getActiveTool: () => canvas.activeTool,
    getZoom: () => canvas.zoom,
    getViewport: () => ({ x: canvas.viewportX, y: canvas.viewportY }),
    getCursor: () => ({ x: canvas.cursorX, y: canvas.cursorY }),

    // State setters
    setObjects: canvas.setObjects,
    setSelectedId: canvas.setSelectedId,
    setSelectedIds: canvas.setSelectedIds,
    setActiveTool: canvas.setActiveTool,
    setZoom: canvas.setZoom,
    setViewport: canvas.setViewport,

    // Utility methods
    selectAll: canvas.selectAll,
    clearSelection: canvas.clearSelection,
    zoomIn: canvas.zoomIn,
    zoomOut: canvas.zoomOut,
    zoomToFit: canvas.zoomToFit,
    zoomTo100: canvas.zoomTo100,

    // Object manipulation
    addObject: canvas.addObject,
    updateObject: canvas.updateObject,
    deleteObject: canvas.deleteObject,
    duplicateObject: canvas.duplicateObject,
    bringForward: canvas.bringForward,
    sendBackward: canvas.sendBackward,

    // Tools
    selectTool: canvas.setActiveTool,
    tools: {
      SELECT: "select",
      HAND: "hand",
      SCALE: "scale",
      FRAME: "frame",
      TEXT: "text",
      IMAGE: "image",
      RECTANGLE: "rectangle",
      ELLIPSE: "ellipse",
      LINE: "line",
      POLYGON: "polygon",
    },

    // Backgrounds
    setBackground: canvas.setCanvasBackground,
    backgrounds: {
      SOLID: "solid",
      DOT_GRID: "dot-grid",
      SQUARE_GRID: "square-grid",
    },

    // Development utilities
    logState: () => {
      console.group("🎨 Canvas Dev API - Current State");
      console.log("Objects:", canvas.objects);
      console.log("Selected ID:", canvas.selectedId);
      console.log("Selected IDs:", canvas.selectedIds);
      console.log("Active Tool:", canvas.activeTool);
      console.log("Zoom:", canvas.zoom);
      console.log("Viewport:", { x: canvas.viewportX, y: canvas.viewportY });
      console.log("Cursor:", { x: canvas.cursorX, y: canvas.cursorY });
      console.groupEnd();
    },

    createTestObject: (type = "rectangle") => {
      const id = `test-${Date.now()}`;
      return {
        id,
        type: type as any,
        x: Math.random() * 400,
        y: Math.random() * 400,
        width: 100,
        height: 100,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 100,
        fill: "#3b82f6",
        stroke: "#000000",
        strokeWidth: 1,
      };
    },
  };

  // Expose to window object (only log once)
  if (typeof window !== "undefined" && !hasExposedAPI) {
    (window as any).canvas = devAPI;
    console.log("🎨 Canvas Dev API available at window.canvas");
    console.log(
      "Try: canvas.logState(), canvas.selectTool(canvas.tools.RECTANGLE), etc."
    );
    hasExposedAPI = true;
  } else if (typeof window !== "undefined") {
    // Update the API reference without logging
    (window as any).canvas = devAPI;
  }

  return devAPI;
}

/**
 * Type declaration for window object extension
 */
declare global {
  interface Window {
    canvas?: DevCanvasAPI;
  }
}
