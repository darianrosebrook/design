"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useCanvasBridge } from "./bridge-context";
import type {
  IncomingMessageType,
  DocumentArtboard,
  DocumentNode,
} from "./bridge-types";
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

interface CanvasContextType {
  objects: CanvasObject[];
  setObjects: (objects: CanvasObject[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  contextMenu: { x: number; y: number; objectId: string } | null;
  setContextMenu: (
    menu: { x: number; y: number; objectId: string } | null
  ) => void;
  activeTool: CanvasTool;
  setActiveTool: (tool: CanvasTool) => void;
  canvasBackground: CanvasBackground;
  setCanvasBackground: (bg: CanvasBackground) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const { bridge, isReady } = useCanvasBridge();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    objectId: string;
  } | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const [canvasBackground, setCanvasBackground] =
    useState<CanvasBackground>("dot-grid");

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
    {
      id: "rect-2",
      type: "rectangle",
      name: "Background",
      x: 50,
      y: 50,
      width: 900,
      height: 700,
      rotation: 0,
      visible: true,
      locked: true,
      opacity: 100,
      fill: "#0a0a0a",
      cornerRadius: 0,
    },
  ]);

  // Listen for document and state updates from extension
  useEffect(() => {
    if (!isReady) {return;}

    const unsubscribers = [
      // Document updates
      bridge.onMessage("setDocument", (message: IncomingMessageType) => {
        if (message.type === "setDocument") {
          // Convert document nodes to canvas objects and update state
          const canvasObjects = message.document.artboards.flatMap(
            (artboard: DocumentArtboard, artboardIndex: number) =>
              artboard.children?.map((child: DocumentNode) => ({
                id: child.id,
                type: child.type as CanvasObject["type"],
                name: child.name || "Unnamed",
                x: child.x || 0,
                y: child.y || 0,
                width: child.width || 100,
                height: child.height || 100,
                rotation: child.rotation || 0,
                visible: child.visible ?? true,
                locked: child.locked ?? false,
                opacity: child.opacity ?? 100,
                fill: child.fill,
                stroke: child.stroke,
                strokeWidth: child.strokeWidth,
                cornerRadius: child.cornerRadius,
                text: child.text,
                fontSize: child.fontSize,
                fontFamily: child.fontFamily,
                fontWeight: child.fontWeight,
                textAlign: child.textAlign as CanvasObject["textAlign"],
                lineHeight: child.lineHeight,
                letterSpacing: child.letterSpacing,
                src: child.src,
                children: child.children as CanvasObject[] | undefined,
                expanded: true, // Default expanded for UI
              })) || []
          );
          setObjects(canvasObjects);
        }
      }),

      // Selection updates
      bridge.onMessage("setSelection", (message: IncomingMessageType) => {
        if (message.type === "setSelection") {
          setSelectedId(message.nodeIds[0] || null);
        }
      }),

      // Selection mode updates
      bridge.onMessage("setSelectionMode", (message: IncomingMessageType) => {
        if (message.type === "setSelectionMode") {
          // Update active tool based on selection mode
          const toolMap: Record<string, CanvasTool> = {
            single: "select",
            rectangle: "select",
            lasso: "select",
          };
          setActiveTool(toolMap[message.mode] || "select");
        }
      }),

      // View mode updates
      bridge.onMessage("viewModeChange", (message: IncomingMessageType) => {
        if (message.type === "viewModeChange") {
          // Handle view mode changes if needed
          console.log("View mode changed:", message.mode);
        }
      }),

      // Error messages
      bridge.onMessage("showError", (message: IncomingMessageType) => {
        if (message.type === "showError") {
          console.error("Extension error:", message.message);
          // TODO: Show error UI to user
        }
      }),

      // Mutation results
      bridge.onMessage(
        "applyMutationResult",
        (message: IncomingMessageType) => {
          if (message.type === "applyMutationResult") {
            if (!message.success) {
              console.error("Mutation failed:", message.error);
              // TODO: Revert optimistic updates and show error to user
            }
          }
        }
      ),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [bridge, isReady]);

  const updateObject = (id: string, updates: Partial<CanvasObject>) => {
    // Send property change mutation through bridge
    const propertyKey = Object.keys(updates)[0];
    const value = Object.values(updates)[0];
    const oldValue = objects.find((obj) => obj.id === id)?.[
      propertyKey as keyof CanvasObject
    ];

    bridge.sendMessage({
      id: crypto.randomUUID(),
      version: "0.1.0",
      timestamp: Date.now(),
      type: "propertyChange",
      nodeId: id,
      changes: updates,
      event: {
        nodeId: id,
        propertyKey,
        value,
        oldValue,
      },
    });

    // Update local state optimistically
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

    // TODO: Send layer reordering mutation through bridge
    console.log("[canvas-context] Layer reordered:", { fromIndex, toIndex });
  };

  // Override setSelectedId to send selection changes
  const handleSetSelectedId = (id: string | null) => {
    setSelectedId(id);
    if (isReady) {
      bridge.sendMessage({
        id: crypto.randomUUID(),
        version: "0.1.0",
        timestamp: Date.now(),
        type: "selectionChange",
        nodeIds: id ? [id] : [],
      });
    }
  };

  return (
    <CanvasContext.Provider
      value={{
        objects,
        setObjects,
        selectedId,
        setSelectedId: handleSetSelectedId,
        updateObject,
        contextMenu,
        setContextMenu,
        activeTool,
        setActiveTool,
        canvasBackground,
        setCanvasBackground,
        reorderLayers,
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
