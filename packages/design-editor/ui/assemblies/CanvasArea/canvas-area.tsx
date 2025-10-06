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
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    setContextMenu,
    updateNode,
    activeTool,
    canvasBackground,
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

  const handleCanvasClick = () => {
    if (activeTool === "select") {
      setSelectedId(null);
      setSelectedIds(new Set()); // Clear multi-selection
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
    }
  };

  const handleObjectMouseDown = (e: React.MouseEvent, obj: CanvasObject) => {
    if (activeTool !== "select" || obj.locked) return;

    e.stopPropagation();
    setSelectedId(obj.id);
    setSelectedIds(new Set([obj.id])); // Update multi-selection to include this object
    setIsDragging(true);
    // Store screen coordinates for drag calculations
    setDragStart({ x: e.clientX, y: e.clientY });
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
      if (!selectedId) return;

      if (isDragging) {
        // Convert screen delta to canvas coordinates accounting for zoom
        const dx = (e.clientX - dragStart.x) / (zoom / 100);
        const dy = (e.clientY - dragStart.y) / (zoom / 100);
        updateNode(selectedId, {
          frame: {
            x: objectStart.x + dx,
            y: objectStart.y + dy,
          },
        });
      } else if (isResizing && resizeHandle) {
        // Convert screen delta to canvas coordinates accounting for zoom
        const dx = (e.clientX - dragStart.x) / (zoom / 100);
        const dy = (e.clientY - dragStart.y) / (zoom / 100);

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

        updateNode(selectedId, {
          frame: updates,
        });
      }
    };

    const handleMouseUp = () => {
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
    updateNode,
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
      outline: isSelected ? "none" : undefined,
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
          backgroundColor: "#18181b",
          backgroundImage:
            "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 1px, transparent 0)",
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        };
      case "square-grid":
        return {
          backgroundColor: "#18181b",
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        };
      case "solid":
        return {
          backgroundColor: "#0a0a0a",
        };
      default:
        return {};
    }
  };

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden"
      onClick={handleCanvasClick}
      onContextMenu={handleContextMenu}
      onMouseMove={handleCanvasMouseMove}
      style={getBackgroundStyle()}
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
