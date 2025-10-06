"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type React from "react";
import type { CanvasObject } from "./types";

export type CanvasTool =
  | "select"
  | "hand"
  | "scale"
  | "frame"
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
  objects: CanvasObject[];
  setObjects: (objects: CanvasObject[]) => void;
  selectedId: string | null;
  selectedIds: Set<string>;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: Set<string>) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
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
  copyToClipboard: (objectIds: string[]) => void;
  pasteFromClipboard: (offsetX?: number, offsetY?: number) => void;
  cutToClipboard: (objectIds: string[]) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  duplicateObject: (id: string) => void;
  deleteObject: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  selectAll: () => void;
  addObject: (object: CanvasObject) => void;
  addObjectToParent: (
    parentId: string,
    object: CanvasObject,
    slotIndex?: number
  ) => void;
  // Aliases for linting purposes
  _duplicateObject: (id: string) => void;
  _deleteObject: (id: string) => void;
  _bringForward: (id: string) => void;
  _sendBackward: (id: string) => void;
  _selectAll: () => void;
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

  const [objects, setObjects] = useState<CanvasObject[]>([
    {
      id: "frame-1",
      type: "frame",
      name: "Design Frame",
      x: 100,
      y: 100,
      width: 800,
      height: 600,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      fill: "#1a1a1a",
      cornerRadius: 16,
      expanded: true,
      children: [
        {
          id: "text-1",
          type: "text",
          name: "Heading Text",
          x: 150,
          y: 150,
          width: 300,
          height: 60,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          text: "Design Editor",
          fontSize: 48,
          fontFamily: "Inter",
          fontWeight: "700",
          textAlign: "left",
          lineHeight: 1.2,
          letterSpacing: -0.02,
          fill: "#ffffff",
        },
        {
          id: "rect-1",
          type: "rectangle",
          name: "Card Background",
          x: 150,
          y: 240,
          width: 400,
          height: 200,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          fill: "#2a2a2a",
          stroke: "#3a3a3a",
          strokeWidth: 2,
          cornerRadius: 16,
        },
        {
          id: "circle-1",
          type: "circle",
          name: "Avatar",
          x: 600,
          y: 150,
          width: 80,
          height: 80,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          fill: "#4a9eff",
          stroke: "#ffffff",
          strokeWidth: 3,
        },
        {
          id: "image-1",
          type: "image",
          name: "Product Image",
          x: 180,
          y: 270,
          width: 120,
          height: 120,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          src: "/diverse-products-still-life.png",
          cornerRadius: 8,
        },
      ],
    },
  ]);

  const updateObject = (id: string, updates: Partial<CanvasObject>) => {
    const updateRecursive = (objs: CanvasObject[]): CanvasObject[] => {
      return objs.map((obj) => {
        if (obj.id === id) {
          return { ...obj, ...updates };
        }
        if (obj.children) {
          return { ...obj, children: updateRecursive(obj.children) };
        }
        return obj;
      });
    };
    setObjects(updateRecursive(objects));
  };

  const reorderLayers = (fromIndex: number, toIndex: number) => {
    const newObjects = [...objects];
    const [removed] = newObjects.splice(fromIndex, 1);
    newObjects.splice(toIndex, 0, removed);
    setObjects(newObjects);
  };

  const duplicateObject = (id: string) => {
    const findObject = (
      objs: CanvasObject[],
      targetId: string
    ): CanvasObject | null => {
      for (const obj of objs) {
        if (obj.id === targetId) {
          return obj;
        }
        if (obj.children) {
          const found = findObject(obj.children, targetId);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    const originalObject = findObject(objects, id);
    if (!originalObject) {
      return;
    }

    const duplicateObjectRecursive = (obj: CanvasObject): CanvasObject => ({
      ...obj,
      id: `${obj.type}-${Date.now()}`,
      name: `${obj.name} Copy`,
      x: obj.x + 20,
      y: obj.y + 20,
      children: obj.children?.map(duplicateObjectRecursive),
    });

    const duplicatedObject = duplicateObjectRecursive(originalObject);

    // Check if the object is inside another object
    const isInsideObject = (
      objs: CanvasObject[],
      targetId: string
    ): boolean => {
      for (const obj of objs) {
        if (
          obj.children?.some(
            (child) =>
              child.id === targetId || isInsideObject([child], targetId)
          )
        ) {
          return true;
        }
      }
      return false;
    };

    if (isInsideObject(objects, id)) {
      // Find the parent and add to it
      let parentId = null;
      const findParent = (
        objs: CanvasObject[],
        targetId: string
      ): string | null => {
        for (const obj of objs) {
          if (obj.children?.some((child) => child.id === targetId)) {
            return obj.id;
          }
          if (obj.children) {
            const found = findParent(obj.children, targetId);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };
      parentId = findParent(objects, id);
      if (parentId) {
        addObjectToParent(parentId, duplicatedObject);
      }
    } else {
      // Add to root level
      setObjects([...objects, duplicatedObject]);
    }

    setSelectedId(duplicatedObject.id);
  };

  const deleteObject = (id: string) => {
    const removeObjectRecursive = (objs: CanvasObject[]): CanvasObject[] => {
      return objs
        .filter((obj) => obj.id !== id)
        .map((obj) => ({
          ...obj,
          children: obj.children
            ? removeObjectRecursive(obj.children)
            : undefined,
        }));
    };
    setObjects(removeObjectRecursive(objects));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const bringForward = (id: string) => {
    const findObjectIndex = (
      objs: CanvasObject[],
      targetId: string
    ): number => {
      for (let i = 0; i < objs.length; i++) {
        if (objs[i].id === targetId) {
          return i;
        }
      }
      return -1;
    };

    const moveObjectForward = (objs: CanvasObject[]): CanvasObject[] => {
      const index = findObjectIndex(objs, id);
      if (index > -1 && index < objs.length - 1) {
        const newObjects = [...objs];
        const [removed] = newObjects.splice(index, 1);
        newObjects.splice(index + 1, 0, removed);
        return newObjects;
      }
      return objs.map((obj) => ({
        ...obj,
        children: obj.children ? moveObjectForward(obj.children) : undefined,
      }));
    };

    setObjects(moveObjectForward(objects));
  };

  const sendBackward = (id: string) => {
    const findObjectIndex = (
      objs: CanvasObject[],
      targetId: string
    ): number => {
      for (let i = 0; i < objs.length; i++) {
        if (objs[i].id === targetId) {
          return i;
        }
      }
      return -1;
    };

    const moveObjectBackward = (objs: CanvasObject[]): CanvasObject[] => {
      const index = findObjectIndex(objs, id);
      if (index > 0) {
        const newObjects = [...objs];
        const [removed] = newObjects.splice(index, 1);
        newObjects.splice(index - 1, 0, removed);
        return newObjects;
      }
      return objs.map((obj) => ({
        ...obj,
        children: obj.children ? moveObjectBackward(obj.children) : undefined,
      }));
    };

    setObjects(moveObjectBackward(objects));
  };

  const selectAll = () => {
    // Find all visible objects recursively
    const findAllVisibleObjects = (objs: CanvasObject[]): CanvasObject[] => {
      const visibleObjects: CanvasObject[] = [];
      for (const obj of objs) {
        if (obj.visible) {
          visibleObjects.push(obj);
          if (obj.children) {
            visibleObjects.push(...findAllVisibleObjects(obj.children));
          }
        }
      }
      return visibleObjects;
    };

    const visibleObjects = findAllVisibleObjects(objects);
    // For now, select the first visible object (future: implement multi-selection)
    if (visibleObjects.length > 0) {
      setSelectedId(visibleObjects[0].id);
    }
  };

  const addObject = (object: CanvasObject) => {
    setObjects((prev) => [...prev, object]);
    // Select the newly added object
    setSelectedId(object.id);
    setSelectedIds(new Set([object.id]));
  };

  const addObjectToParent = (
    parentId: string,
    object: CanvasObject,
    slotIndex?: number
  ) => {
    setObjects((prev) => {
      const addToParent = (objs: CanvasObject[]): CanvasObject[] => {
        return objs.map((obj) => {
          if (obj.id === parentId) {
            const children = obj.children || [];
            const newChildren =
              slotIndex !== undefined
                ? [
                    ...children.slice(0, slotIndex),
                    object,
                    ...children.slice(slotIndex),
                  ]
                : [...children, object];
            return { ...obj, children: newChildren };
          }
          if (obj.children) {
            return { ...obj, children: addToParent(obj.children) };
          }
          return obj;
        });
      };
      return addToParent(prev);
    });
    // Select the newly added object
    setSelectedId(object.id);
    setSelectedIds(new Set([object.id]));
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

    const selectedObject = objects.find((obj) => obj.id === selectedId);
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
  const copyToClipboard = (objectIds: string[]) => {
    const objectsToCopy = objectIds
      .map((id) => objects.find((obj) => obj.id === id))
      .filter(Boolean) as CanvasObject[];
    setClipboard(objectsToCopy);
  };

  const pasteFromClipboard = (offsetX = 10, offsetY = 10) => {
    if (clipboard.length === 0) return;

    const newObjects = clipboard.map((obj) => ({
      ...obj,
      id: `${obj.type}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      x: obj.x + offsetX,
      y: obj.y + offsetY,
    }));

    setObjects((prev) => [...prev, ...newObjects]);

    // Select the pasted objects
    if (newObjects.length > 0) {
      setSelectedId(newObjects[0].id);
      setSelectedIds(new Set(newObjects.map((obj) => obj.id)));
    }
  };

  const cutToClipboard = (objectIds: string[]) => {
    copyToClipboard(objectIds);
    // Remove the objects after copying
    objectIds.forEach((id) => deleteObject(id));
  };

  return (
    <CanvasContext.Provider
      value={{
        objects,
        setObjects,
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        addToSelection,
        removeFromSelection,
        clearSelection,
        updateObject,
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
        reorderLayers,
        duplicateObject,
        deleteObject,
        bringForward,
        sendBackward,
        selectAll,
        addObject,
        addObjectToParent,
        // Aliases for linting purposes
        _duplicateObject: duplicateObject,
        _deleteObject: deleteObject,
        _bringForward: bringForward,
        _sendBackward: sendBackward,
        _selectAll: selectAll,
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

// Utility function to find objects in the canvas hierarchy
export function findObject(
  objs: CanvasObject[],
  id: string
): CanvasObject | null {
  for (const obj of objs) {
    if (obj.id === id) {
      return obj;
    }
    if (obj.children) {
      const found = findObject(obj.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
