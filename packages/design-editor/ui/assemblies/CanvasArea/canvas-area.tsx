"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useCanvas } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";
import { ZoomControls } from "@/components/zoom-controls";
import { CursorPositionTracker } from "@/components/cursor-position-tracker";
import { ScaleBar } from "@/components/scale-bar";

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w";

export function CanvasArea() {
  const {
    document,
    setDocument,
    objects,
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    addToSelection,
    setContextMenu,
    updateNode,
    createNode,
    activeTool,
    setActiveTool,
    canvasBackground,
    canvasBackgroundColor,
    zoom,
    cursorX,
    cursorY,
    viewportX,
    viewportY,
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent, objectId?: string) => {
    e.preventDefault();

    // If right-clicking on an object, select it first
    if (objectId && selectedId !== objectId) {
      setSelectedId(objectId);
    }

    setContextMenu({
      type: objectId ? "layers" : "canvas",
      x: e.clientX,
      y: e.clientY,
      objectId,
    });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool === "select") {
      setSelectedId(null);
      setSelectedIds(new Set()); // Clear multi-selection
    } else {
      // Handle creation tools (rectangle, ellipse, line, text, frame, image)
      handleToolCreation(e);
    }
    setContextMenu(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      // Account for zoom and viewport transforms
      const x = (e.clientX - rect.left - viewportX) / (zoom / 100);
      const y = (e.clientY - rect.top - viewportY) / (zoom / 100);
      setCursorPosition(x, y);

      // Handle drawing preview for creation tools
      if (
        isDrawing &&
        (activeTool === "rectangle" ||
          activeTool === "ellipse" ||
          activeTool === "line")
      ) {
        // This would update a preview object - for now we'll just track the current position
        // In a full implementation, you might want to show a preview rectangle/line while dragging
      }
    }
  };

  const handleToolCreation = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Convert click position to canvas coordinates
    const x = (e.clientX - rect.left - viewportX) / (zoom / 100);
    const y = (e.clientY - rect.top - viewportY) / (zoom / 100);

    // Create objects based on active tool
    switch (activeTool) {
      case "rectangle":
        createRectangle(x, y);
        break;
      case "ellipse":
        createEllipse(x, y);
        break;
      case "line":
        createLine(x, y);
        break;
      case "text":
        createText(x, y);
        break;
      case "frame":
        createFrame(x, y);
        break;
      case "image":
        createImage(x, y);
        break;
      case "polygon":
        createPolygon(x, y);
        break;
    }
  };

  const createRectangle = (x: number, y: number) => {
    const newId = `rectangle-${Date.now()}`;
    const newObject: CanvasObject = {
      id: newId,
      type: "rectangle",
      name: "Rectangle",
      x: x - 50, // Center the rectangle on click
      y: y - 25,
      width: 100,
      height: 50,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      fill: "#4a9eff",
      stroke: "#1e40af",
      strokeWidth: 2,
      cornerRadius: 4,
    };

    // Add to document using the canvas engine
    createNode([0, "children"], {
      type: "rectangle",
      name: newObject.name,
      frame: {
        x: newObject.x,
        y: newObject.y,
        width: newObject.width,
        height: newObject.height,
      },
      visible: newObject.visible,
      style: {
        fills: [{ type: "solid", color: newObject.fill }],
        strokes: [
          {
            type: "solid",
            color: newObject.stroke,
            width: newObject.strokeWidth,
          },
        ],
        radius: newObject.cornerRadius,
        opacity: newObject.opacity / 100,
      },
    });

    // Select the new object - use setTimeout to ensure the object is added first
    setTimeout(() => {
      setSelectedId(newId);
      setSelectedIds(new Set([newId]));
      // Also add to multi-selection
      addToSelection(newId);
    }, 0);
  };

  const createEllipse = (x: number, y: number) => {
    const newId = `ellipse-${Date.now()}`;
    const newObject: CanvasObject = {
      id: newId,
      type: "circle",
      name: "Ellipse",
      x: x - 50,
      y: y - 25,
      width: 100,
      height: 50,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      fill: "#f59e0b",
      stroke: "#d97706",
      strokeWidth: 2,
      cornerRadius: 50, // Makes it a circle/ellipse
    };

    createNode([0, "children"], {
      type: "circle",
      name: newObject.name,
      frame: {
        x: newObject.x,
        y: newObject.y,
        width: newObject.width,
        height: newObject.height,
      },
      visible: newObject.visible,
      style: {
        fills: [{ type: "solid", color: newObject.fill }],
        strokes: [
          {
            type: "solid",
            color: newObject.stroke,
            width: newObject.strokeWidth,
          },
        ],
        radius: newObject.cornerRadius,
        opacity: newObject.opacity / 100,
      },
    });

    // Select the new object - use setTimeout to ensure the object is added first
    setTimeout(() => {
      setSelectedId(newId);
      setSelectedIds(new Set([newId]));
      // Also add to multi-selection
      addToSelection(newId);
    }, 0);
  };

  const createLine = (x: number, y: number) => {
    const newId = `line-${Date.now()}`;
    const newObject: CanvasObject = {
      id: newId,
      type: "rectangle", // Using rectangle as a line for now
      name: "Line",
      x: x - 50,
      y: y - 1,
      width: 100,
      height: 2,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      fill: "transparent",
      stroke: "#374151",
      strokeWidth: 2,
      cornerRadius: 0,
    };

    createNode([0, "children"], {
      type: "rectangle",
      name: newObject.name,
      frame: {
        x: newObject.x,
        y: newObject.y,
        width: newObject.width,
        height: newObject.height,
      },
      visible: newObject.visible,
      style: {
        fills: [],
        strokes: [
          {
            type: "solid",
            color: newObject.stroke,
            width: newObject.strokeWidth,
          },
        ],
        radius: newObject.cornerRadius,
        opacity: newObject.opacity / 100,
      },
    });

    // Select the new object - use setTimeout to ensure the object is added first
    setTimeout(() => {
      setSelectedId(newId);
      setSelectedIds(new Set([newId]));
      // Also add to multi-selection
      addToSelection(newId);
    }, 0);
  };

  const createText = (x: number, y: number) => {
    const newId = `text-${Date.now()}`;
    const newObject: CanvasObject = {
      id: newId,
      type: "text",
      name: "Text",
      x: x,
      y: y,
      width: 120,
      height: 40,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      text: "Text",
      fontSize: 16,
      fontFamily: "Inter",
      fontWeight: "400",
      textAlign: "left",
      lineHeight: 1.5,
      letterSpacing: 0,
      fill: "#1f2937",
    };

    createNode([0, "children"], {
      type: "text",
      name: newObject.name,
      frame: {
        x: newObject.x,
        y: newObject.y,
        width: newObject.width,
        height: newObject.height,
      },
      visible: newObject.visible,
      text: newObject.text,
      textStyle: {
        size: newObject.fontSize,
        family: newObject.fontFamily,
        weight: newObject.fontWeight,
        color: newObject.fill,
        lineHeight: newObject.lineHeight,
        letterSpacing: newObject.letterSpacing,
      },
    });

    // Select the new object - use setTimeout to ensure the object is added first
    setTimeout(() => {
      setSelectedId(newId);
      setSelectedIds(new Set([newId]));
      // Also add to multi-selection
      addToSelection(newId);
    }, 0);
  };

  const createFrame = (x: number, y: number) => {
    const newId = `frame-${Date.now()}`;
    const newObject: CanvasObject = {
      id: newId,
      type: "frame",
      name: "Frame",
      x: x - 100,
      y: y - 75,
      width: 200,
      height: 150,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      fill: "rgba(255, 255, 255, 0.05)",
      stroke: "rgba(255, 255, 255, 0.2)",
      strokeWidth: 1,
      cornerRadius: 8,
      children: [],
    };

    createNode([0, "children"], {
      type: "frame",
      name: newObject.name,
      frame: {
        x: newObject.x,
        y: newObject.y,
        width: newObject.width,
        height: newObject.height,
      },
      visible: newObject.visible,
      style: {
        fills: [{ type: "solid", color: newObject.fill }],
        strokes: [
          {
            type: "solid",
            color: newObject.stroke,
            width: newObject.strokeWidth,
          },
        ],
        radius: newObject.cornerRadius,
        opacity: newObject.opacity / 100,
      },
      children: [],
    });

    // Select the new object - use setTimeout to ensure the object is added first
    setTimeout(() => {
      setSelectedId(newId);
      setSelectedIds(new Set([newId]));
      // Also add to multi-selection
      addToSelection(newId);
    }, 0);
  };

  const createImage = (x: number, y: number) => {
    const newId = `image-${Date.now()}`;
    const newObject: CanvasObject = {
      id: newId,
      type: "image",
      name: "Image",
      x: x - 75,
      y: y - 50,
      width: 150,
      height: 100,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      src: "/placeholder.svg", // Placeholder image
      cornerRadius: 4,
    };

    createNode([0, "children"], {
      type: "image",
      name: newObject.name,
      frame: {
        x: newObject.x,
        y: newObject.y,
        width: newObject.width,
        height: newObject.height,
      },
      visible: newObject.visible,
      style: {
        radius: newObject.cornerRadius,
        opacity: newObject.opacity / 100,
      },
      src: newObject.src,
    });

    // Select the new object - use setTimeout to ensure the object is added first
    setTimeout(() => {
      setSelectedId(newId);
      setSelectedIds(new Set([newId]));
      // Also add to multi-selection
      addToSelection(newId);
    }, 0);
  };

  const createPolygon = (x: number, y: number) => {
    // For now, create a triangle using multiple rectangles
    // In a full implementation, this would create a proper polygon object
    const newId = `polygon-${Date.now()}`;
    const newObject: CanvasObject = {
      id: newId,
      type: "frame",
      name: "Polygon",
      x: x - 50,
      y: y - 50,
      width: 100,
      height: 100,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      fill: "#10b981",
      stroke: "#059669",
      strokeWidth: 2,
      cornerRadius: 0,
      children: [
        // Triangle made of rectangles (placeholder)
        {
          id: `triangle-1-${Date.now()}`,
          type: "rectangle" as const,
          name: "Triangle Part 1",
          x: 0,
          y: 50,
          width: 100,
          height: 50,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          fill: "#10b981",
          stroke: "#059669",
          strokeWidth: 2,
        },
        {
          id: `triangle-2-${Date.now()}`,
          type: "rectangle" as const,
          name: "Triangle Part 2",
          x: 25,
          y: 0,
          width: 50,
          height: 50,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          fill: "#10b981",
          stroke: "#059669",
          strokeWidth: 2,
        },
      ],
    };

    createNode([0, "children"], {
      type: "frame",
      name: newObject.name,
      frame: {
        x: newObject.x,
        y: newObject.y,
        width: newObject.width,
        height: newObject.height,
      },
      visible: newObject.visible,
      style: {
        fills: [{ type: "solid", color: newObject.fill }],
        strokes: [
          {
            type: "solid",
            color: newObject.stroke,
            width: newObject.strokeWidth,
          },
        ],
        radius: newObject.cornerRadius,
        opacity: newObject.opacity / 100,
      },
      children:
        newObject.children?.map((child) => ({
          type: child.type,
          name: child.name,
          frame: {
            x: child.x,
            y: child.y,
            width: child.width,
            height: child.height,
          },
          visible: child.visible,
          style: {
            fills: child.fill ? [{ type: "solid", color: child.fill }] : [],
            strokes: child.stroke
              ? [
                  {
                    type: "solid",
                    color: child.stroke,
                    width: child.strokeWidth || 1,
                  },
                ]
              : [],
            opacity: child.opacity / 100,
          },
        })) || [],
    });

    // Select the new object - use setTimeout to ensure the object is added first
    setTimeout(() => {
      setSelectedId(newId);
      setSelectedIds(new Set([newId]));
      // Also add to multi-selection
      addToSelection(newId);
    }, 0);
  };

  const handleObjectMouseDown = (e: React.MouseEvent, obj: CanvasObject) => {
    if (activeTool !== "select" || obj.locked) return;

    e.stopPropagation();
    setSelectedId(obj.id);
    setSelectedIds(new Set([obj.id])); // Update multi-selection to include this object
    setIsDragging(true);
    // Store canvas coordinates for drag calculations (account for zoom and viewport)
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const canvasX = (e.clientX - rect.left - viewportX) / (zoom / 100);
      const canvasY = (e.clientY - rect.top - viewportY) / (zoom / 100);
      setDragStart({ x: canvasX, y: canvasY });
    }
    setObjectStart({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
    });
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    handle: ResizeHandle,
    obj: CanvasObject
  ) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    // Store canvas coordinates for resize calculations (account for zoom and viewport)
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const canvasX = (e.clientX - rect.left - viewportX) / (zoom / 100);
      const canvasY = (e.clientY - rect.top - viewportY) / (zoom / 100);
      setDragStart({ x: canvasX, y: canvasY });
    }
    setObjectStart({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedId) return;

      if (isDragging) {
        // Convert current mouse position to canvas coordinates
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const currentX = (e.clientX - rect.left - viewportX) / (zoom / 100);
          const currentY = (e.clientY - rect.top - viewportY) / (zoom / 100);

          const dx = currentX - dragStart.x;
          const dy = currentY - dragStart.y;

          updateNode(selectedId, {
            frame: {
              x: objectStart.x + dx,
              y: objectStart.y + dy,
            },
          });
        }
      } else if (isResizing && resizeHandle) {
        // Convert current mouse position to canvas coordinates
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const currentX = (e.clientX - rect.left - viewportX) / (zoom / 100);
          const currentY = (e.clientY - rect.top - viewportY) / (zoom / 100);

          const dx = currentX - dragStart.x;
          const dy = currentY - dragStart.y;

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
              updates = {
                x: objectStart.x + dx,
                width: objectStart.width - dx,
              };
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

          updateNode(selectedId, {
            frame: updates,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle tool shortcuts
      const toolMap: Record<string, CanvasTool> = {
        v: "select",
        h: "hand",
        k: "scale",
        f: "frame",
        t: "text",
        i: "image",
        r: "rectangle",
        e: "ellipse",
        l: "line",
        p: "polygon",
        g: "group",
        s: "section",
        Escape: "select", // Escape always goes back to select
      };

      const key = e.key.toLowerCase();
      if (key in toolMap && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setActiveTool(toolMap[key]);
      }

      // Handle other shortcuts
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          // Delete the selected object
          const newObjects = objects.filter((obj) => obj.id !== selectedId);
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
        }
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }

    // Add keyboard shortcuts
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isDragging,
    isResizing,
    dragStart,
    objectStart,
    selectedId,
    resizeHandle,
    updateNode,
    viewportX,
    viewportY,
    zoom,
    objects,
    setDocument,
    setActiveTool,
    setSelectedId,
    setSelectedIds,
  ]);

  const renderResizeHandles = (obj: CanvasObject) => {
    if (!obj || obj.id !== selectedId || activeTool !== "select") return null;

    const handles: ResizeHandle[] = [
      "nw",
      "ne",
      "sw",
      "se",
      "n",
      "e",
      "s",
      "w",
    ];

    return handles.map((handle) => {
      const style: React.CSSProperties = {
        position: "absolute",
        width: "8px",
        height: "8px",
        backgroundColor: "#4a9eff",
        border: "1px solid white",
        borderRadius: "1920px",
        cursor: `${handle}-resize`,
        zIndex: 10,
      };

      // Position handles
      if (handle.includes("n")) style.top = "-4px";
      if (handle.includes("s")) style.bottom = "-4px";
      if (handle.includes("w")) style.left = "-4px";
      if (handle.includes("e")) style.right = "-4px";
      if (handle === "n" || handle === "s") {
        style.left = "50%";
        style.transform = "translateX(-50%)";
        style.width = "8px";
      }
      if (handle === "e" || handle === "w") {
        style.top = "50%";
        style.transform = "translateY(-50%)";
        style.height = "8px";
      }

      return (
        <div
          key={handle}
          style={style}
          onMouseDown={(e) => handleResizeMouseDown(e, handle, obj)}
        />
      );
    });
  };

  const renderObject = (obj: CanvasObject) => {
    const isSelected = obj.id === selectedId;
    // Ensure opacity is a valid number between 0 and 100
    const safeOpacity = isNaN(obj.opacity)
      ? 100
      : Math.max(0, Math.min(100, obj.opacity));
    const commonStyles = {
      position: "absolute" as const,
      left: obj.x,
      top: obj.y,
      width: obj.width,
      height: obj.height,
      transform: `rotate(${obj.rotation}deg)`,
      opacity: safeOpacity / 100,
      cursor: activeTool === "select" && !obj.locked ? "move" : "default",
      border: isSelected ? "2px solid #4a9eff" : "none",
      outline: isSelected ? "2px solid rgba(74, 158, 255, 0.3)" : "none",
      outlineOffset: isSelected ? "4px" : "0px",
      pointerEvents: (obj.locked
        ? "none"
        : "auto") as React.CSSProperties["pointerEvents"],
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeTool === "select") {
        setSelectedId(obj.id);
      }
    };

    switch (obj.type) {
      case "rectangle":
        return (
          <div
            key={obj.id}
            style={{
              ...commonStyles,
              backgroundColor: obj.fill,
              border: isSelected
                ? "2px solid #4a9eff"
                : obj.stroke
                ? `${obj.strokeWidth}px solid ${obj.stroke}`
                : "none",
              borderRadius: obj.cornerRadius,
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
          >
            {isSelected && renderResizeHandles(obj)}
          </div>
        );

      case "circle":
        return (
          <div
            key={obj.id}
            style={{
              ...commonStyles,
              backgroundColor: obj.fill,
              border: isSelected
                ? "2px solid #4a9eff"
                : obj.stroke
                ? `${obj.strokeWidth}px solid ${obj.stroke}`
                : "none",
              borderRadius: "50%",
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
          >
            {isSelected && renderResizeHandles(obj)}
          </div>
        );

      case "text":
        return (
          <div
            key={obj.id}
            style={{
              ...commonStyles,
              color: obj.fill,
              fontSize: obj.fontSize,
              fontFamily: obj.fontFamily,
              fontWeight: obj.fontWeight,
              textAlign: obj.textAlign,
              lineHeight: obj.lineHeight,
              letterSpacing: `${obj.letterSpacing}em`,
              display: "flex",
              alignItems: "center",
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
          >
            {obj.text}
            {isSelected && renderResizeHandles(obj)}
          </div>
        );

      case "image":
        return (
          <div
            key={obj.id}
            style={{
              ...commonStyles,
              borderRadius: obj.cornerRadius,
              overflow: "hidden",
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
          >
            <img
              src={obj.src || "/placeholder.svg"}
              alt={obj.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none" as const,
              }}
            />
            {isSelected && renderResizeHandles(obj)}
          </div>
        );

      case "frame":
        return (
          <div
            key={obj.id}
            style={{
              ...commonStyles,
              backgroundColor: obj.fill,
              borderRadius: obj.cornerRadius,
              border: isSelected
                ? "2px solid #4a9eff"
                : "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
          >
            {obj.children?.map((child) => renderObject(child))}
            {isSelected && renderResizeHandles(obj)}
          </div>
        );

      default:
        return null;
    }
  };

  const getBackgroundStyle = () => {
    const baseGridSize = 20;
    const scaledGridSize = baseGridSize * (zoom / 100);

    switch (canvasBackground) {
      case "dot-grid":
        return {
          backgroundColor: canvasBackgroundColor,
          backgroundImage:
            "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 1px, transparent 0)",
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        };
      case "square-grid":
        return {
          backgroundColor: canvasBackgroundColor,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        };
      case "solid":
        return {
          backgroundColor: canvasBackgroundColor,
        };
      default:
        return {};
    }
  };

  // Get cursor style based on active tool
  const getCanvasCursor = () => {
    switch (activeTool) {
      case "select":
        return selectedId ? "move" : "default";
      case "hand":
        return "grab";
      case "rectangle":
      case "ellipse":
      case "line":
      case "polygon":
        return "crosshair";
      case "text":
        return "text";
      case "frame":
        return "crosshair";
      case "image":
        return "copy";
      case "scale":
        return "zoom-in";
      default:
        return "default";
    }
  };

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden"
      onClick={handleCanvasClick}
      onContextMenu={handleContextMenu}
      onMouseMove={handleCanvasMouseMove}
      style={{
        ...getBackgroundStyle(),
        cursor: getCanvasCursor(),
      }}
    >
      {/* Canvas content with zoom and viewport transforms */}
      <div
        className="relative w-full h-full"
        style={{
          transform: `scale(${
            zoom / 100
          }) translate(${viewportX}px, ${viewportY}px)`,
          transformOrigin: "0 0",
        }}
      >
        {document.artboards[0]?.children
          ?.filter((obj) => obj && obj.id)
          .map((obj) => renderObject(obj)) || []}
      </div>

      {/* Tool indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
          {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Tool
        </div>
      </div>

      {/* Bottom left UI container */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        <CursorPositionTracker />
        <ScaleBar />
      </div>

      {/* Zoom indicator */}
      <ZoomControls />
    </div>
  );
}
