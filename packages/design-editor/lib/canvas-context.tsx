"use client";

import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type { NodePath } from "@paths-design/canvas-engine";
import { DesignTokensSchema } from "@paths-design/design-tokens";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type React from "react";
import {
  createNode,
  updateNode,
  findNodeById,
} from "@paths-design/canvas-engine";
// Import specific functions to avoid bundling Node.js dependencies
import { flattenTokens } from "@paths-design/design-tokens";
import { resolveTokenReferences } from "@paths-design/design-tokens";
import type { CanvasObject } from "./types";
import type { DesignTokens } from "@paths-design/design-tokens";

export type CanvasTool =
  | "select"
  | "hand"
  | "scale"
  | "frame"
  | "group"
  | "section"
  | "page"
  | "text"
  | "image"
  | "rectangle"
  | "ellipse"
  | "line"
  | "polygon";
export type CanvasBackground = "dot-grid" | "square-grid" | "solid";
export type ContextMenuType = "canvas" | "layers" | "properties";
export type ContextMenuTarget = {
  type: ContextMenuType;
  x: number;
  y: number;
  objectId?: string;
  layerId?: string;
  propertyPath?: string;
  element?: HTMLElement;
};

interface CanvasContextType {
  // Legacy compatibility - still used by existing components
  objects: CanvasObject[];
  setObjects: (objects: CanvasObject[]) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  addObject: (object: CanvasObject) => void;

  // New document-based state
  document: CanvasDocumentType;
  setDocument: (document: CanvasDocumentType) => void;

  // Selection state
  selectedId: string | null;
  selectedIds: Set<string>;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: Set<string>) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;

  // Engine-based operations
  createNode: (parentPath: NodePath, nodeData: any) => Promise<void>;
  updateNode: (nodeId: string, updates: any) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  findNodeById: (nodeId: string) => any;

  // Design tokens
  designTokens: DesignTokens | null;
  flattenedTokens: Record<string, string | number>;
  getTokenValue: (tokenPath: string) => string | number | undefined;
  contextMenu: ContextMenuTarget | null;
  setContextMenu: (menu: ContextMenuTarget | null) => void;
  activeTool: CanvasTool;
  setActiveTool: (tool: CanvasTool) => void;
  canvasBackground: CanvasBackground;
  setCanvasBackground: (bg: CanvasBackground) => void;
  canvasBackgroundColor: string;
  setCanvasBackgroundColor: (color: string) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  zoomTo100: () => void;
  // Viewport panning
  viewportX: number;
  viewportY: number;
  setViewport: (x: number, y: number) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  // Cursor tracking
  cursorX: number;
  cursorY: number;
  setCursorPosition: (x: number, y: number) => void;
  // Clipboard functions
  clipboard: CanvasObject[];
  copyToClipboard: (objectIds?: string[]) => void;
  pasteFromClipboard: () => void;
  cutToClipboard: (objectIds?: string[]) => void;
  duplicateObject: (objectId?: string) => void;
  deleteObject: (objectId?: string) => void;
  bringForward: (objectId: string) => void;
  sendBackward: (objectId: string) => void;
  selectAll: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(
    null
  );
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const [canvasBackground, setCanvasBackground] =
    useState<CanvasBackground>("solid");
  const [canvasBackgroundColor, setCanvasBackgroundColor] =
    useState<string>("#18181b");
  const [zoom, setZoom] = useState<number>(100);

  // Viewport panning state
  const [viewportX, setViewportX] = useState<number>(0);
  const [viewportY, setViewportY] = useState<number>(0);

  // Cursor tracking state
  const [cursorX, setCursorX] = useState<number>(0);
  const [cursorY, setCursorY] = useState<number>(0);

  // Clipboard state
  const [clipboard, setClipboard] = useState<CanvasObject[]>([]);

  // Design tokens state
  const [designTokens, setDesignTokens] = useState<DesignTokens | null>(null);
  const [flattenedTokens, setFlattenedTokens] = useState<
    Record<string, string | number>
  >({});
  const [isDesignTokensManagerOpen, setIsDesignTokensManagerOpen] =
    useState(false);

  /**
   * Transform the loaded design tokens from the JSON file format to the expected DesignTokens schema
   */
  const transformTokensToSchema = (loadedTokens: any): DesignTokens => {
    const core = loadedTokens.core || {};

    // Extract color tokens - map from the nested structure
    const extractColorValue = (path: string): string => {
      const parts = path.split(".");
      let current: any = core.color;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
          // Handle W3C token format with $value
          if (current && typeof current === "object" && "$value" in current) {
            current = current.$value;
          }
        } else {
          return "#000000"; // fallback
        }
      }
      return typeof current === "string" ? current : "#000000";
    };

    // Extract spacing tokens - map numbered keys to semantic names
    const extractSpacingValue = (key: string): number => {
      const spacing = core.spacing?.size;
      if (!spacing || typeof spacing !== "object") return 0;

      // Map semantic keys to numbered keys
      const keyMap: Record<string, string> = {
        xs: "00",
        sm: "01",
        md: "02",
        lg: "03",
        xl: "04",
        "2xl": "05",
        "3xl": "06",
      };

      const numberedKey = keyMap[key] || key;
      if (numberedKey in spacing) {
        const value = spacing[numberedKey];
        if (value && typeof value === "object" && "$value" in value) {
          const rawValue = value.$value;
          if (typeof rawValue === "string") {
            // Parse CSS values like "1px" to numbers
            const match = rawValue.match(/^(\d+(?:\.\d+)?)px?$/);
            return match ? parseFloat(match[1]) : 0;
          }
          return typeof rawValue === "number" ? rawValue : 0;
        }
        return typeof value === "number" ? value : 0;
      }
      return 0;
    };

    // Extract typography tokens
    const extractTypographyValue = (
      category: string,
      key: string
    ): string | number => {
      const typography = core.typography?.[category];
      if (!typography || typeof typography !== "object") {
        return category === "fontFamily" ? "sans-serif" : 16;
      }

      if (category === "ramp") {
        // Map semantic keys to numbered keys for font sizes
        const keyMap: Record<string, string> = {
          xs: "1",
          sm: "2",
          md: "3",
          lg: "4",
          xl: "5",
          "2xl": "6",
          "3xl": "7",
        };
        const numberedKey = keyMap[key] || key;
        if (numberedKey in typography) {
          const value = typography[numberedKey];
          if (value && typeof value === "object" && "$value" in value) {
            return typeof value.$value === "number" ? value.$value : 16;
          }
          return typeof value === "number" ? value : 16;
        }
      } else if (category === "weight") {
        // Weight keys should map directly
        const weightMap: Record<string, string> = {
          normal: "regular",
          medium: "medium",
          semibold: "semibold",
          bold: "bold",
        };
        const weightKey = weightMap[key] || key;
        if (weightKey in typography) {
          const value = typography[weightKey];
          if (value && typeof value === "object" && "$value" in value) {
            // Convert to string since schema expects string values for weights
            const rawValue = value.$value;
            return String(rawValue);
          }
          // Convert to string since schema expects string values for weights
          return String(value);
        }
      } else if (category === "lineHeight") {
        // Line height keys
        if (key in typography) {
          const value = typography[key];
          if (value && typeof value === "object" && "$value" in value) {
            return typeof value.$value === "number" ? value.$value : 1.5;
          }
          return typeof value === "number" ? value : 1.5;
        }
      } else {
        // fontFamily and other direct keys
        if (key in typography) {
          const value = typography[key];
          if (value && typeof value === "object" && "$value" in value) {
            return String(value.$value);
          }
          return String(value);
        }
      }
      return category === "fontFamily" ? "sans-serif" : 16;
    };

    // Extract shape tokens (radius and borderWidth)
    const extractShapeValue = (category: string, key: string): number => {
      const shape = core.shape?.[category];
      if (shape && typeof shape === "object" && key in shape) {
        const value = shape[key];
        if (value && typeof value === "object" && "$value" in value) {
          return typeof value.$value === "number" ? value.$value : 0;
        }
        return typeof value === "number" ? value : 0;
      }
      return 0;
    };

    // Extract elevation tokens (shadow)
    const extractShadowValue = (key: string): string => {
      const elevation = core.elevation;
      if (!elevation) return "none";

      // Build shadow from level components
      const level = elevation.level?.[key];
      const offset = elevation.offset?.[key];
      const blur = elevation.blur?.[key];
      const spread = elevation.spread?.[key];

      if (level && typeof level === "object" && "$value" in level) {
        const levelValue = level.$value;
        const offsetValue =
          offset && typeof offset === "object" && "$value" in offset
            ? offset.$value
            : 0;
        const blurValue =
          blur && typeof blur === "object" && "$value" in blur
            ? blur.$value
            : 0;
        const spreadValue =
          spread && typeof spread === "object" && "$value" in spread
            ? spread.$value
            : 0;

        return `${offsetValue}px ${offsetValue}px ${blurValue}px ${spreadValue}px rgba(0, 0, 0, ${levelValue})`;
      }

      return "none";
    };

    // Extract layer tokens (zIndex)
    const extractZIndexValue = (key: string): number => {
      const layer = core.layer?.[key];
      if (layer && typeof layer === "object" && "$value" in layer) {
        return typeof layer.$value === "number" ? layer.$value : 0;
      }
      return 0;
    };

    return {
      color: {
        background: {
          primary: extractColorValue("mode.black"),
          secondary: extractColorValue("mode.light"),
          tertiary: extractColorValue("palette.neutral.200"),
          surface: extractColorValue("palette.neutral.100"),
          elevated: extractColorValue("palette.neutral.50"),
        },
        text: {
          primary: extractColorValue("mode.black"),
          secondary: extractColorValue("palette.neutral.600"),
          tertiary: extractColorValue("palette.neutral.400"),
          inverse: extractColorValue("mode.white"),
        },
        border: {
          subtle: extractColorValue("palette.neutral.300"),
          default: extractColorValue("palette.neutral.400"),
          strong: extractColorValue("palette.neutral.500"),
        },
        interactive: {
          primary: extractColorValue("palette.primary.500"),
          primaryHover: extractColorValue("palette.primary.600"),
          primaryPressed: extractColorValue("palette.primary.700"),
          secondary: extractColorValue("palette.neutral.500"),
          secondaryHover: extractColorValue("palette.neutral.600"),
          secondaryPressed: extractColorValue("palette.neutral.700"),
          destructive: extractColorValue("palette.error.500"),
          destructiveHover: extractColorValue("palette.error.600"),
          destructivePressed: extractColorValue("palette.error.700"),
        },
        semantic: {
          success: extractColorValue("palette.success.500"),
          warning: extractColorValue("palette.warning.500"),
          error: extractColorValue("palette.error.500"),
          info: extractColorValue("palette.info.500"),
        },
      },
      space: {
        xs: extractSpacingValue("xs"),
        sm: extractSpacingValue("sm"),
        md: extractSpacingValue("md"),
        lg: extractSpacingValue("lg"),
        xl: extractSpacingValue("xl"),
        "2xl": extractSpacingValue("2xl") || extractSpacingValue("xl") * 2,
        "3xl": extractSpacingValue("3xl") || extractSpacingValue("xl") * 3,
      },
      type: {
        family: {
          sans: extractTypographyValue("fontFamily", "sans") as string,
          mono: extractTypographyValue("fontFamily", "mono") as string,
        },
        size: {
          xs: extractTypographyValue("ramp", "xs") as number,
          sm: extractTypographyValue("ramp", "sm") as number,
          md: extractTypographyValue("ramp", "md") as number,
          lg: extractTypographyValue("ramp", "lg") as number,
          xl: extractTypographyValue("ramp", "xl") as number,
          "2xl": extractTypographyValue("ramp", "2xl") as number,
          "3xl": extractTypographyValue("ramp", "3xl") as number,
        },
        weight: {
          normal: extractTypographyValue("weight", "normal") as string,
          medium: extractTypographyValue("weight", "medium") as string,
          semibold: extractTypographyValue("weight", "semibold") as string,
          bold: extractTypographyValue("weight", "bold") as string,
        },
        lineHeight: {
          tight: extractTypographyValue("lineHeight", "tight") as number,
          normal: extractTypographyValue("lineHeight", "normal") as number,
          loose: extractTypographyValue("lineHeight", "loose") as number,
        },
      },
      radius: {
        none: extractShapeValue("radius", "none"),
        sm: extractShapeValue("radius", "sm"),
        md: extractShapeValue("radius", "md"),
        lg: extractShapeValue("radius", "lg"),
        xl: extractShapeValue("radius", "xl"),
        full: extractShapeValue("radius", "full"),
      },
      shadow: {
        sm: extractShadowValue("sm"),
        md: extractShadowValue("md"),
        lg: extractShadowValue("lg"),
        xl: extractShadowValue("xl"),
      },
      borderWidth: {
        none: extractShapeValue("border", "none"),
        sm: extractShapeValue("border", "sm"),
        md: extractShapeValue("border", "md"),
        lg: extractShapeValue("border", "lg"),
      },
      zIndex: {
        dropdown: extractZIndexValue("dropdown"),
        sticky: extractZIndexValue("overlay"),
        fixed: extractZIndexValue("overlay"),
        modal: extractZIndexValue("modal"),
        popover: extractZIndexValue("overlay"),
        tooltip: extractZIndexValue("tooltip"),
      },
    };
  };

  // Load design tokens on mount
  useEffect(() => {
    const loadDesignTokens = async () => {
      try {
        // Load the design tokens from the JSON file (client-side fetch)
        const response = await fetch("/designTokens.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.status}`);
        }
        const tokens = await response.json();

        // Transform and validate tokens
        const transformedTokens = transformTokensToSchema(tokens);
        const validatedTokens = DesignTokensSchema.parse(transformedTokens);
        setDesignTokens(validatedTokens);

        // Flatten tokens for easy access and resolve references
        const resolvedTokens = resolveTokenReferences(validatedTokens, {
          strict: false,
        });
        const flattened = flattenTokens(resolvedTokens, "core");
        setFlattenedTokens(flattened);

        console.info(
          "✅ Loaded design tokens:",
          Object.keys(flattened).length,
          "flattened tokens"
        );
      } catch (error) {
        console.warn("Failed to load design tokens:", error);
        // Fallback to empty tokens
        setDesignTokens(null);
        setFlattenedTokens({});
      }
    };

    loadDesignTokens();
  }, []);

  // Multi-selection helpers
  const addToSelection = (id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id));
    setSelectedId(id);
  };

  const removeFromSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    // If this was the primary selection, update it
    if (selectedId === id) {
      const remainingIds = Array.from(selectedIds).filter(
        (selectedId) => selectedId !== id
      );
      setSelectedId(remainingIds.length > 0 ? remainingIds[0] : null);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectedId(null);
  };

  const inverseSelection = () => {
    const allObjectIds = objects.map((obj) => obj.id);
    const unselectedIds = allObjectIds.filter((id) => !selectedIds.has(id));
    setSelectedIds(new Set(unselectedIds));
    setSelectedId(unselectedIds.length > 0 ? unselectedIds[0] : null);
  };

  // Create default document with initial content
  const createDefaultDocument = (): CanvasDocumentType => ({
    schemaVersion: "0.1.0",
    id: "default-document",
    name: "New Document",
    artboards: [
      {
        id: "main-artboard",
        name: "Main Artboard",
        frame: { x: 0, y: 0, width: 1200, height: 800 },
        children: [
          {
            id: "frame-1",
            type: "frame",
            name: "Design Frame",
            frame: { x: 100, y: 100, width: 800, height: 600 },
            visible: true,
            style: {
              fills: [{ type: "solid", color: "#1a1a1a" }],
              radius: 16,
              opacity: 1,
            },
            children: [
              {
                id: "text-1",
                type: "text",
                name: "Heading Text",
                frame: { x: 150, y: 150, width: 300, height: 60 },
                visible: true,
                text: "Design Editor",
                textStyle: {
                  size: 32,
                  family: "Inter",
                  weight: "600",
                  color: "#ffffff",
                },
              },
            ],
          },
        ],
      },
    ],
  });

  const [document, setDocument] = useState<CanvasDocumentType>(
    createDefaultDocument()
  );

  // Engine-based operations
  const createNodeOperation = async (parentPath: NodePath, nodeData: any) => {
    const result = createNode(document, parentPath, nodeData);
    if (result.success && result.data) {
      setDocument(result.data.document);
      // TODO: Apply patches for undo/redo
    }
  };

  const updateNodeOperation = async (nodeId: string, updates: any) => {
    const result = updateNode(document, nodeId, updates);
    if (result.success && result.data) {
      setDocument(result.data.document);
      // TODO: Apply patches for undo/redo
    }
  };

  const deleteNodeOperation = async (nodeId: string) => {
    // Find the node to determine its path for deletion
    const findResult = findNodeById(document, nodeId);
    if (findResult.success && findResult.data) {
      // For deletion, we need to implement deleteNode in canvas-engine
      // For now, we'll use updateNode to mark as invisible
      await updateNodeOperation(nodeId, { visible: false });
    }
  };

  // Legacy compatibility - convert document to objects array for existing components
  const objects = document.artboards[0]?.children || [];

  // Legacy compatibility - object operations that delegate to engine
  const updateObject = async (id: string, updates: Partial<CanvasObject>) => {
    await updateNodeOperation(id, updates);
  };

  const addObject = (object: CanvasObject) => {
    // Convert to document format and create node
    createNodeOperation([0, "children"], {
      type: object.type,
      name: object.name,
      frame: {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
      },
      visible: object.visible,
      style: {
        fills: object.fill
          ? [{ type: "solid", color: object.fill }]
          : undefined,
        strokes: object.stroke
          ? [
              {
                type: "solid",
                color: object.stroke,
                width: object.strokeWidth,
              },
            ]
          : undefined,
        radius: object.cornerRadius,
        opacity: object.opacity / 100,
      },
      text: object.text,
      textStyle: object.fontSize
        ? {
            size: object.fontSize,
            family: object.fontFamily,
            weight: object.fontWeight,
            letterSpacing: object.letterSpacing,
            lineHeight: object.lineHeight,
            color: object.fill,
          }
        : undefined,
      src: object.src,
    });
  };

  // Design tokens utilities
  const getTokenValue = (tokenPath: string): string | number | undefined => {
    return flattenedTokens[tokenPath];
  };

  // Zoom controls
  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.25, 500); // Max 500%
    setZoom(Math.round(newZoom * 100) / 100); // Clamp to 2 decimal places
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom * 0.8, 10); // Min 10%
    setZoom(Math.round(newZoom * 100) / 100); // Clamp to 2 decimal places
  };

  const zoomToFit = () => {
    // Calculate bounds of all objects
    if (objects.length === 0) {
      setZoom(100);
      setViewport(0, 0);
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach((obj) => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Add some padding
    const padding = 50;
    const targetWidth = contentWidth + padding * 2;
    const targetHeight = contentHeight + padding * 2;

    // Calculate zoom to fit (assuming viewport is 800x600 for now)
    const viewportWidth = 800;
    const viewportHeight = 600;
    const zoomX = (viewportWidth / targetWidth) * 100;
    const zoomY = (viewportHeight / targetHeight) * 100;
    const fitZoom = Math.min(zoomX, zoomY, 100); // Don't zoom in beyond 100%

    setZoom(Math.round(Math.max(fitZoom, 10) * 100) / 100); // Min 10%, clamp to 2 decimal places

    // Center the content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setViewport(
      viewportWidth / 2 - centerX * (fitZoom / 100),
      viewportHeight / 2 - centerY * (fitZoom / 100)
    );
  };

  const zoomToSelection = () => {
    if (!selectedId) {
      zoomToFit();
      return;
    }

    const selectedObject = findObject(objects, selectedId);
    if (!selectedObject) {
      zoomToFit();
      return;
    }

    const contentWidth = selectedObject.width;
    const contentHeight = selectedObject.height;

    // Add some padding
    const padding = 50;
    const targetWidth = contentWidth + padding * 2;
    const targetHeight = contentHeight + padding * 2;

    // Calculate zoom to fit (assuming viewport is 800x600 for now)
    const viewportWidth = 800;
    const viewportHeight = 600;
    const zoomX = (viewportWidth / targetWidth) * 100;
    const zoomY = (viewportHeight / targetHeight) * 100;
    const fitZoom = Math.min(zoomX, zoomY, 200); // Allow zooming in up to 200%

    setZoom(Math.round(Math.max(fitZoom, 10) * 100) / 100); // Min 10%, clamp to 2 decimal places

    // Center the selected object
    const centerX = selectedObject.x + selectedObject.width / 2;
    const centerY = selectedObject.y + selectedObject.height / 2;
    setViewport(
      viewportWidth / 2 - centerX * (fitZoom / 100),
      viewportHeight / 2 - centerY * (fitZoom / 100)
    );
  };

  const zoomTo100 = () => {
    setZoom(100);
  };

  // Viewport panning functions
  const setViewport = (x: number, y: number) => {
    setViewportX(x);
    setViewportY(y);
  };

  const panViewport = (deltaX: number, deltaY: number) => {
    setViewportX((prev) => prev + deltaX);
    setViewportY((prev) => prev + deltaY);
  };

  // Cursor tracking functions
  const setCursorPosition = (x: number, y: number) => {
    setCursorX(x);
    setCursorY(y);
  };

  // Clipboard functions

  // Copy selected objects to clipboard
  const copyToClipboard = (objectIds?: string[]) => {
    const idsToCopy = objectIds || Array.from(selectedIds);
    if (idsToCopy.length === 0) return;

    const objectsToCopy = objects.filter((obj) => idsToCopy.includes(obj.id));
    setClipboard(objectsToCopy);
  };

  // Cut selected objects to clipboard (removes them from canvas)
  const cutToClipboard = (objectIds?: string[]) => {
    const idsToCut = objectIds || Array.from(selectedIds);
    if (idsToCut.length === 0) return;

    copyToClipboard(idsToCut);
    // Remove objects from canvas
    const newObjects = objects.filter((obj) => !idsToCut.includes(obj.id));
    setDocument((prev) => ({
      ...prev,
      artboards: [
        {
          ...prev.artboards[0],
          children: newObjects,
        },
      ],
    }));

    // Clear selection
    setSelectedId(null);
    setSelectedIds(new Set());
  };

  // Paste objects from clipboard
  const pasteFromClipboard = () => {
    if (clipboard.length === 0) return;

    const pastedObjects = clipboard.map((obj, index) => ({
      ...obj,
      id: `${obj.id}-paste-${Date.now()}-${index}`,
      x: obj.x + 20, // Offset slightly to make paste visible
      y: obj.y + 20,
      visible: true,
    }));

    // Add objects to canvas
    setDocument((prev) => ({
      ...prev,
      artboards: [
        {
          ...prev.artboards[0],
          children: [...prev.artboards[0].children, ...pastedObjects],
        },
      ],
    }));

    // Select the pasted objects
    const newSelectedIds = new Set(pastedObjects.map((obj) => obj.id));
    setSelectedIds(newSelectedIds);
    setSelectedId(pastedObjects[0].id);
  };

  // Duplicate selected objects
  const duplicateObject = (objectId?: string) => {
    const idToDuplicate = objectId || selectedId;
    if (!idToDuplicate) return;

    const objectToDuplicate = objects.find((obj) => obj.id === idToDuplicate);
    if (!objectToDuplicate) return;

    const duplicatedObject = {
      ...objectToDuplicate,
      id: `${objectToDuplicate.id}-duplicate-${Date.now()}`,
      x: objectToDuplicate.x + 20,
      y: objectToDuplicate.y + 20,
    };

    // Add to document
    setDocument((prev) => ({
      ...prev,
      artboards: [
        {
          ...prev.artboards[0],
          children: [...prev.artboards[0].children, duplicatedObject],
        },
      ],
    }));

    setSelectedId(duplicatedObject.id);
    setSelectedIds(new Set([duplicatedObject.id]));
  };

  // Delete selected objects
  const deleteObject = (objectId?: string) => {
    const idToDelete = objectId || selectedId;
    if (!idToDelete) return;

    const newObjects = objects.filter((obj) => obj.id !== idToDelete);
    setDocument((prev) => ({
      ...prev,
      artboards: [
        {
          ...prev.artboards[0],
          children: newObjects,
        },
      ],
    }));

    setSelectedId(null);
    setSelectedIds(new Set());
  };

  // Bring object forward in layer order
  const bringForward = (objectId: string) => {
    const objectIndex = objects.findIndex((obj) => obj.id === objectId);
    if (objectIndex === -1 || objectIndex >= objects.length - 1) return;

    const newObjects = [...objects];
    [newObjects[objectIndex], newObjects[objectIndex + 1]] = [
      newObjects[objectIndex + 1],
      newObjects[objectIndex],
    ];

    setDocument((prev) => ({
      ...prev,
      artboards: [
        {
          ...prev.artboards[0],
          children: newObjects,
        },
      ],
    }));
  };

  // Send object backward in layer order
  const sendBackward = (objectId: string) => {
    const objectIndex = objects.findIndex((obj) => obj.id === objectId);
    if (objectIndex <= 0) return;

    const newObjects = [...objects];
    [newObjects[objectIndex], newObjects[objectIndex - 1]] = [
      newObjects[objectIndex - 1],
      newObjects[objectIndex],
    ];

    setDocument((prev) => ({
      ...prev,
      artboards: [
        {
          ...prev.artboards[0],
          children: newObjects,
        },
      ],
    }));
  };

  // Select all objects
  const selectAll = () => {
    const allIds = objects.map((obj) => obj.id);
    setSelectedIds(new Set(allIds));
    if (allIds.length > 0) {
      setSelectedId(allIds[0]);
    }
  };

  return (
    <CanvasContext.Provider
      value={{
        // Legacy compatibility
        objects,
        setObjects: (newObjects: CanvasObject[]) => {
          setDocument((prev) => ({
            ...prev,
            artboards: [
              {
                ...prev.artboards[0],
                children: newObjects,
              },
            ],
          }));
        },
        updateObject,
        addObject,

        // New document-based state
        document,
        setDocument,

        // Selection state
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        addToSelection,
        removeFromSelection,
        clearSelection,
        inverseSelection,

        // Engine-based operations
        createNode: createNodeOperation,
        updateNode: updateNodeOperation,
        deleteNode: deleteNodeOperation,
        findNodeById: (nodeId: string) => findNodeById(document, nodeId),

        // Design tokens
        designTokens,
        flattenedTokens,
        getTokenValue,
        contextMenu,
        setContextMenu,
        activeTool,
        setActiveTool,
        canvasBackground,
        setCanvasBackground,
        canvasBackgroundColor,
        setCanvasBackgroundColor,
        zoom,
        setZoom,
        zoomIn,
        zoomOut,
        zoomToFit,
        zoomToSelection,
        zoomTo100,
        // Viewport panning
        viewportX,
        viewportY,
        setViewport,
        panViewport,
        // Cursor tracking
        cursorX,
        cursorY,
        setCursorPosition,
        // Clipboard functions
        clipboard,
        copyToClipboard,
        pasteFromClipboard,
        cutToClipboard,
        duplicateObject,
        deleteObject,
        bringForward,
        sendBackward,
        selectAll,
        // Alignment functions
        alignObjects: (alignment: string) => {
          const alignedObjects = alignObjects(objects, selectedIds, alignment);
          setDocument((prev) => ({
            ...prev,
            artboards: [
              {
                ...prev.artboards[0],
                children: alignedObjects,
              },
            ],
          }));
        },
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within CanvasProvider");
  }
  return context;
}

// Alignment functions
export function alignObjects(
  objects: CanvasObject[],
  selectedIds: Set<string>,
  alignment: string
): CanvasObject[] {
  if (selectedIds.size < 2) {
    return objects; // Need at least 2 objects to align
  }

  const selectedObjects = objects.filter((obj) => selectedIds.has(obj.id));
  if (selectedObjects.length < 2) {
    return objects;
  }

  // Calculate bounding box of all selected objects
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  selectedObjects.forEach((obj) => {
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + obj.width);
    maxY = Math.max(maxY, obj.y + obj.height);
  });

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Create updated objects
  const updatedObjects = objects.map((obj) => {
    if (!selectedIds.has(obj.id)) {
      return obj;
    }

    const updatedObj = { ...obj };

    switch (alignment) {
      case "horizontal-left":
        updatedObj.x = minX;
        break;
      case "horizontal-center":
        updatedObj.x = centerX - obj.width / 2;
        break;
      case "horizontal-right":
        updatedObj.x = maxX - obj.width;
        break;
      case "vertical-top":
        updatedObj.y = minY;
        break;
      case "vertical-middle":
        updatedObj.y = centerY - obj.height / 2;
        break;
      case "vertical-bottom":
        updatedObj.y = maxY - obj.height;
        break;
      case "distribute-horizontal":
        // Distribute objects evenly horizontally
        const sortedByX = selectedObjects.sort((a, b) => a.x - b.x);
        const totalWidth = maxX - minX;
        const spacing = totalWidth / (selectedObjects.length - 1);
        sortedByX.forEach((sortedObj, index) => {
          if (obj.id === sortedObj.id) {
            updatedObj.x = minX + spacing * index - obj.width / 2;
          }
        });
        break;
      case "distribute-vertical":
        // Distribute objects evenly vertically
        const sortedByY = selectedObjects.sort((a, b) => a.y - b.y);
        const totalHeight = maxY - minY;
        const verticalSpacing = totalHeight / (selectedObjects.length - 1);
        sortedByY.forEach((sortedObj, index) => {
          if (obj.id === sortedObj.id) {
            updatedObj.y = minY + verticalSpacing * index - obj.height / 2;
          }
        });
        break;
    }

    return updatedObj;
  });

  return updatedObjects;
}

// Utility function to find objects in the canvas hierarchy
export function findObject(
  objs: CanvasObject[] | undefined | null,
  id: string
): CanvasObject | null {
  if (!objs || !Array.isArray(objs)) {
    return null;
  }

  for (const obj of objs) {
    if (!obj || typeof obj !== "object") {
      continue;
    }

    if (obj.id === id) {
      return obj;
    }
    if (obj.children && Array.isArray(obj.children)) {
      const found = findObject(obj.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
