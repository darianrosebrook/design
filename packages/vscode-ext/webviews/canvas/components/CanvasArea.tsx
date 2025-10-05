"use client";

import { createCanvasRenderer } from "@paths-design/canvas-renderer-dom";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useCanvasBridge } from "../lib/bridge-context";
import { useCanvas } from "../lib/canvas-context";
import type { CanvasObject } from "../lib/types";

export function CanvasArea() {
  const [_zoom, _setZoom] = useState(100);
  const {
    objects,
    selectedId: _selectedId,
    setSelectedId,
    setContextMenu,
    updateObject,
    activeTool,
    canvasBackground,
  } = useCanvas();

  const { bridge: _bridge, isReady: _isReady } = useCanvasBridge();

  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas renderer
  const rendererRef = useRef(
    createCanvasRenderer({
      interactive: true,
      onSelectionChange: (nodeIds: string[]) => {
        setSelectedId(nodeIds[0] || null);
      },
      onNodeUpdate: (nodeId: string, updates: Partial<CanvasObject>) => {
        updateObject(nodeId, updates);
      },
    })
  );

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
            type: obj.type,
            name: obj.name,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            rotation: obj.rotation,
            visible: obj.visible,
            locked: obj.locked,
            opacity: obj.opacity,
            fill: obj.fill,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            cornerRadius: obj.cornerRadius,
            text: obj.text,
            fontSize: obj.fontSize,
            fontFamily: obj.fontFamily,
            fontWeight: obj.fontWeight,
            textAlign: obj.textAlign,
            lineHeight: obj.lineHeight,
            letterSpacing: obj.letterSpacing,
            src: obj.src,
            children: obj.children,
          })),
        },
      ],
    };
  };

  // Render document when objects change
  useEffect(() => {
    if (canvasRef.current && objects.length > 0) {
      try {
        const document = convertObjectsToDocument(objects);
        rendererRef.current.render(document, canvasRef.current);
      } catch (error) {
        console.error("Failed to render document:", error);
        // TODO: Show error state to user
      }
    }
  }, [objects]);

  const handleCanvasClick = () => {
    if (activeTool === "select") {
      setSelectedId(null);
    }
    setContextMenu(null);
  };

  const getBackgroundStyle = () => {
    switch (canvasBackground) {
      case "dot-grid":
        return {
          backgroundColor: "#18181b",
          backgroundImage:
            "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        };
      case "square-grid":
        return {
          backgroundColor: "#18181b",
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
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
      className="relative flex-1 overflow-hidden"
      onClick={handleCanvasClick}
      style={getBackgroundStyle()}
    >
      {/* Canvas renderer will populate this container */}
      <div className="w-full h-full" />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium">
        100%
      </div>
    </div>
  );
}
