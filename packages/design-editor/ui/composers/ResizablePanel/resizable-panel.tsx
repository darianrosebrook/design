"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  side: "left" | "right";
}

export function ResizablePanel({
  children,
  defaultWidth,
  minWidth,
  maxWidth,
  side,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) {
        return;
      }

      const panelRect = panelRef.current.getBoundingClientRect();
      let newWidth: number;

      if (side === "left") {
        newWidth = e.clientX - panelRect.left;
      } else {
        newWidth = panelRect.right - e.clientX;
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, side]);

  return (
    <div
      ref={panelRef}
      className="relative bg-card border border-border rounded-lg shadow-sm overflow-hidden h-full"
      style={{ width: `${width}px` }}
    >
      {children}
      <div
        className={`absolute top-0 bottom-0 w-1 bg-border hover:bg-primary cursor-col-resize transition-colors ${
          side === "left" ? "right-0" : "left-0"
        }`}
        onMouseDown={() => setIsResizing(true)}
      >
        <div
          className={`absolute inset-0 ${
            side === "left" ? "-right-1" : "-left-1"
          }`}
        />
      </div>
    </div>
  );
}
