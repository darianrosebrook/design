"use client";

import { createCanvasRenderer } from "@paths-design/canvas-renderer-dom";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { loadIndex } from "@paths-design/component-indexer";
import React, { useState, useRef, useEffect } from "react";
import { ZoomControls } from "./zoom-controls";
import { useCanvas } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w";

export function CanvasArea() {
  const {
    objects,
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    setContextMenu,
    updateObject,
    addObject,
    activeTool,
    canvasBackground,
    canvasBackgroundColor,
    designTokens,
    flattenedTokens,
    getTokenValue,
    _duplicateObject,
    _deleteObject,
    _bringForward,
    _sendBackward,
    _selectAll,
    zoom,
    viewportX,
    viewportY,
    panViewport,
    cursorX,
    cursorY,
    setCursorPosition,
  } = useCanvas();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [objectStart, setObjectStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Component index for component resolution
  const [componentIndex, setComponentIndex] = useState<any>(null);

  // Load component index on mount
  useEffect(() => {
    const loadComponentIndex = async () => {
      try {
        // Try to load from design system package first
        const index = await loadIndex(
          "../design-system/dist/component-index.json"
        );
        console.info(
          "✅ Loaded component index:",
          index.components.length,
          "components"
        );
        setComponentIndex(index);
      } catch (error) {
        console.warn("Failed to load component index:", error);
        // Fallback to empty index
        setComponentIndex({ components: [] });
      }
    };

    loadComponentIndex();
  }, []);

  // Canvas renderer
  const rendererRef = useRef<any>(null);

  // Create renderer when component index is loaded
  useEffect(() => {
    if (componentIndex && !rendererRef.current) {
      console.info(
        "🔧 Creating CanvasDOMRenderer with component index:",
        componentIndex.components?.length || 0,
        "components"
      );
      rendererRef.current = createCanvasRenderer({
        interactive: true,
        componentIndex,
        onSelectionChange: (nodeIds: string[]) => {
          console.info("🎯 Selection changed:", nodeIds);
          setSelectedId(nodeIds[0] || null);
        },
        onNodeUpdate: (nodeId: string, updates: Partial<CanvasObject>) => {
          console.info("📝 Node updated:", nodeId, updates);
          updateObject(nodeId, updates);
        },
      });
    }
  }, [componentIndex]);

  // Convert objects to document format for renderer
  const convertObjectsToDocument = (
    objs: CanvasObject[]
  ): CanvasDocumentType => {
    return {
      schemaVersion: "0.1.0",
      id: "webview-document",
      name: "Webview Document",
      artboards: [
        {
          id: "main-artboard",
          name: "Main Artboard",
          frame: { x: 0, y: 0, width: 1200, height: 800 },
          children: objs.map((obj) => ({
            id: obj.id,
            type: obj.type as any,
            name: obj.name,
            frame: {
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height,
            },
            visible: obj.visible,
            style: {
              fills: obj.fill
                ? [{ type: "solid", color: obj.fill }]
                : undefined,
              strokes: obj.stroke
                ? [
                    {
                      type: "solid",
                      color: obj.stroke,
                      width: obj.strokeWidth,
                    },
                  ]
                : undefined,
              radius: obj.cornerRadius,
              opacity: obj.opacity / 100,
            },
            text: obj.text,
            textStyle: obj.fontSize
              ? {
                  size: obj.fontSize,
                  family: obj.fontFamily,
                  weight: obj.fontWeight,
                  letterSpacing: obj.letterSpacing,
                  lineHeight: obj.lineHeight,
                }
              : undefined,
            src: obj.src,
          })),
        },
      ],
    };
  };

  const _handleContextMenu = (e: React.MouseEvent, objectId?: string) => {
    e.preventDefault();
    setContextMenu({
      type: "canvas",
      x: e.clientX,
      y: e.clientY,
      objectId,
    });
  };

  const handleCanvasClick = () => {
    if (activeTool === "select") {
      setSelectedId(null);
      setSelectedIds(new Set());
    }
    setContextMenu(null);
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // Mouse event handlers for panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed && !isDragging && !isResizing) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // Update cursor position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const canvasX = (e.clientX - rect.left - viewportX) / (zoom / 100);
      const canvasY = (e.clientY - rect.top - viewportY) / (zoom / 100);
      setCursorPosition(canvasX, canvasY);
    }

    if (isPanning) {
      e.preventDefault();
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      panViewport(deltaX, deltaY);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData("component-type");
    if (componentType) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - 32) / (zoom / 100) - viewportX; // Adjust for zoom and viewport
        const y = (e.clientY - rect.top - 32) / (zoom / 100) - viewportY;

        const newComponent = {
          id: `component-${Date.now()}`,
          type: "component" as const,
          name: `${componentType} Component`,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: componentType === "Button" ? 120 : 200,
          height: componentType === "Button" ? 40 : 60,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          componentType,
          componentProps: {},
        };

        addObject(newComponent);
      }
    }
  };

  const _handleObjectMouseDown = (e: React.MouseEvent, obj: CanvasObject) => {
    if (activeTool !== "select" || obj.locked || obj.name === "Background") {
      return;
    }

    e.stopPropagation();

    // Handle multi-selection based on modifier keys
    if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl click: toggle selection
      if (selectedIds.has(obj.id)) {
        const newSet = new Set(selectedIds);
        newSet.delete(obj.id);
        setSelectedIds(newSet);
        // If this was the primary selection, update it
        if (selectedId === obj.id) {
          const remainingIds = Array.from(selectedIds).filter(
            (id) => id !== obj.id
          );
          setSelectedId(remainingIds.length > 0 ? remainingIds[0] : null);
        }
      } else {
        const newSet = new Set(selectedIds);
        newSet.add(obj.id);
        setSelectedIds(newSet);
        setSelectedId(obj.id);
      }
    } else if (e.shiftKey && selectedId) {
      // Shift click: add to selection
      const newSet = new Set(selectedIds);
      newSet.add(obj.id);
      setSelectedIds(newSet);
      setSelectedId(obj.id);
    } else {
      // Regular click: single selection
      setSelectedIds(new Set([obj.id]));
      setSelectedId(obj.id);
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setObjectStart({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
    });
  };

  const _getResizeCursor = (handle: ResizeHandle): string => {
    switch (handle) {
      case "nw":
      case "se":
        return "nw-resize";
      case "ne":
      case "sw":
        return "ne-resize";
      case "n":
      case "s":
        return "ns-resize";
      case "e":
      case "w":
        return "ew-resize";
      default:
        return "default";
    }
  };

  const _handleResizeMouseDown = (
    e: React.MouseEvent,
    handle: ResizeHandle,
    obj: CanvasObject
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent text selection during resize
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    (document.body.style as any).mozUserSelect = "none";
    (document.body.style as any).msUserSelect = "none";

    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setObjectStart({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedId) {
        return;
      }

      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        updateObject(selectedId, {
          x: objectStart.x + dx,
          y: objectStart.y + dy,
        });
      } else if (isResizing && resizeHandle) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        let updates: Partial<CanvasObject> = {};

        switch (resizeHandle) {
          case "se":
            updates = {
              width: objectStart.width + dx,
              height: objectStart.height + dy,
            };
            break;
          case "sw":
            updates = {
              x: objectStart.x + dx,
              width: objectStart.width - dx,
              height: objectStart.height + dy,
            };
            break;
          case "ne":
            updates = {
              y: objectStart.y + dy,
              width: objectStart.width + dx,
              height: objectStart.height - dy,
            };
            break;
          case "nw":
            updates = {
              x: objectStart.x + dx,
              y: objectStart.y + dy,
              width: objectStart.width - dx,
              height: objectStart.height - dy,
            };
            break;
          case "e":
            updates = { width: objectStart.width + dx };
            break;
          case "w":
            updates = { x: objectStart.x + dx, width: objectStart.width - dx };
            break;
          case "s":
            updates = { height: objectStart.height + dy };
            break;
          case "n":
            updates = {
              y: objectStart.y + dy,
              height: objectStart.height - dy,
            };
            break;
        }

        updateObject(selectedId, updates);
      }
    };

    const handleMouseUp = () => {
      // Restore text selection
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      (document.body.style as any).mozUserSelect = "";
      (document.body.style as any).msUserSelect = "";

      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDragging,
    isResizing,
    dragStart,
    objectStart,
    selectedId,
    resizeHandle,
    updateObject,
  ]);

  // Handle Delete/Backspace for selected objects (specific to canvas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace for selected objects
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        _deleteObject(selectedId);
        return;
      }
    };

    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener("keydown", handleKeyDown);
      return () => canvasElement.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedId, _deleteObject]);

  // Render document when objects change and renderer is ready
  useEffect(() => {
    if (canvasRef.current && objects.length > 0 && rendererRef.current) {
      try {
        const document = convertObjectsToDocument(objects);
        rendererRef.current.render(document, canvasRef.current);
      } catch (error) {
        console.error("Failed to render document:", error);
        // TODO: Show error state to user
      }
    }
  }, [objects, componentIndex]);

  // Functions removed as CanvasDOMRenderer now handles rendering

  const getBackgroundStyle = () => {
    const baseGridSize = 20;
    const scaledGridSize = baseGridSize * (zoom / 100);

    // Use design tokens if available, otherwise fall back to canvasBackgroundColor
    const backgroundColor =
      designTokens && flattenedTokens
        ? getTokenValue("semantic.color.background.primary") ||
          canvasBackgroundColor
        : canvasBackgroundColor;

    switch (canvasBackground) {
      case "dot-grid":
        return {
          backgroundColor,
          backgroundImage:
            "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 1px, transparent 0)",
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        };
      case "square-grid":
        return {
          backgroundColor,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        };
      case "solid":
        return {
          backgroundColor,
        };
      default:
        return {
          backgroundColor,
        };
    }
  };

  return (
    <div
      ref={canvasRef}
      className={`canvas-area relative w-full h-full overflow-hidden focus:outline-none ${
        isDragging || isResizing ? "no-select" : ""
      } ${isSpacePressed ? "cursor-grab" : ""} ${
        isPanning ? "cursor-grabbing" : ""
      }`}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
      tabIndex={0}
      style={getBackgroundStyle()}
    >
      {/* CanvasDOMRenderer handles all object rendering with zoom and pan */}
      <div
        ref={canvasRef}
        className="relative w-full h-full"
        style={{
          transform: `scale(${
            zoom / 100
          }) translate(${viewportX}px, ${viewportY}px)`,
          transformOrigin: "0 0",
        }}
      />

      {/* Map-like UI controls */}
      <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium z-[100]">
        <div>
          Cursor: {Math.round(cursorX)}, {Math.round(cursorY)}
        </div>
        <div>
          Viewport: {Math.round(viewportX)}, {Math.round(viewportY)}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-[100]">
        <ZoomControls />
      </div>
    </div>
  );
}
