"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useCanvas } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";
import { ZoomControls } from "./zoom-controls";

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w";

export function CanvasArea() {
  const {
    objects,
    selectedId,
    setSelectedId,
    setContextMenu,
    updateObject,
    activeTool,
    canvasBackground,
    canvasBackgroundColor,
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

  const handleContextMenu = (e: React.MouseEvent, objectId?: string) => {
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

  const handleObjectMouseDown = (e: React.MouseEvent, obj: CanvasObject) => {
    if (activeTool !== "select" || obj.locked) {
      return;
    }

    e.stopPropagation();
    setSelectedId(obj.id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setObjectStart({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
    });
  };

  const getResizeCursor = (handle: ResizeHandle): string => {
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

  const handleResizeMouseDown = (
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

  const renderObject = (obj: CanvasObject) => {
    const commonStyles = {
      position: "absolute" as const,
      left: obj.x,
      top: obj.y,
      width: obj.width,
      height: obj.height,
      transform: `rotate(${obj.rotation}deg)`,
      opacity: obj.opacity / 100,
      cursor: activeTool === "select" && !obj.locked ? "move" : "default",
      border: "none",
      outline: "none",
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
              border: obj.stroke
                ? `${obj.strokeWidth}px solid ${obj.stroke}`
                : "none",
              borderRadius: obj.cornerRadius,
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
          />
        );

      case "circle":
        return (
          <div
            key={obj.id}
            style={{
              ...commonStyles,
              backgroundColor: obj.fill,
              border: obj.stroke
                ? `${obj.strokeWidth}px solid ${obj.stroke}`
                : "none",
              borderRadius: "50%",
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
          />
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
                pointerEvents: "none" as React.CSSProperties["pointerEvents"],
              }}
            />
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
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
          >
            {obj.children?.map((child) => renderObject(child))}
          </div>
        );

      default:
        return null;
    }
  };

  const getBackgroundStyle = () => {
    switch (canvasBackground) {
      case "dot-grid":
        return {
          backgroundColor: canvasBackgroundColor,
          backgroundImage:
            "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        };
      case "square-grid":
        return {
          backgroundColor: canvasBackgroundColor,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        };
      case "solid":
        return {
          backgroundColor: canvasBackgroundColor,
        };
      default:
        return {
          backgroundColor: canvasBackgroundColor,
        };
    }
  };

  // Render bounding box overlay for selected element
  const renderBoundingBoxOverlay = () => {
    if (!selectedId || activeTool !== "select") {
      return null;
    }

    const selectedObj = objects.find((obj) => obj.id === selectedId);
    if (!selectedObj) {
      return null;
    }

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

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: selectedObj.x - 2, // Account for border width
          top: selectedObj.y - 2,
          width: selectedObj.width + 4,
          height: selectedObj.height + 4,
          border: "2px solid #4a9eff",
          borderRadius:
            selectedObj.type === "circle"
              ? "50%"
              : selectedObj.cornerRadius || 0,
          transform: `rotate(${selectedObj.rotation}deg)`,
          zIndex: 10, // Lower z-index to not interfere with panels
          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.3)", // Subtle white outline for better visibility
        }}
      >
        {/* Render resize handles as part of the bounding box */}
        {handles.map((handle) => {
          const handleStyle: React.CSSProperties = {
            position: "absolute",
            width: "8px",
            height: "8px",
            backgroundColor: "#4a9eff",
            border: "1px solid white",
            borderRadius: "2px",
            cursor: getResizeCursor(handle),
            zIndex: 11, // Above the bounding box
          };

          // Position handles relative to the bounding box
          if (handle.includes("n")) {
            handleStyle.top = "-6px"; // -4px for handle center + -2px for border
          }
          if (handle.includes("s")) {
            handleStyle.bottom = "-6px";
          }
          if (handle.includes("w")) {
            handleStyle.left = "-6px";
          }
          if (handle.includes("e")) {
            handleStyle.right = "-6px";
          }
          if (handle === "n" || handle === "s") {
            handleStyle.left = "50%";
            handleStyle.transform = "translateX(-50%)";
          }
          if (handle === "e" || handle === "w") {
            handleStyle.top = "50%";
            handleStyle.transform = "translateY(-50%)";
          }

          return (
            <div
              key={handle}
              className="resize-handle pointer-events-auto"
              style={handleStyle}
              onMouseDown={(e) => handleResizeMouseDown(e, handle, selectedObj)}
            />
          );
        })}
      </div>
    );
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
      tabIndex={0}
      style={getBackgroundStyle()}
    >
      {/* Canvas content */}
      <div
        className="relative w-full h-full p-8"
        style={{
          transform: `scale(${
            zoom / 100
          }) translate(${viewportX}px, ${viewportY}px)`,
          transformOrigin: "top left",
        }}
      >
        {objects.map((obj) => renderObject(obj))}
      </div>

      {/* Bounding box overlay - always on top */}
      <div className="absolute inset-0 pointer-events-none p-8">
        {renderBoundingBoxOverlay()}
      </div>

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
