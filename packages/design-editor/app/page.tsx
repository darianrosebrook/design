"use client";

import { useState } from "react";
import { CanvasProvider, useCanvas } from "@/lib/canvas-context";
import { DevTools } from "@/lib/dev-tools";
import { GlobalShortcutsProvider } from "@/lib/global-shortcuts-provider";
import { ActionBar } from "@/ui/assemblies/ActionBar";
import { CanvasArea } from "@/ui/assemblies/CanvasArea";
import { ContextMenu } from "@/ui/assemblies/ContextMenu";
import { DesignSystemOverlay } from "@/ui/assemblies/DesignSystemOverlay";
import { PanelContainer } from "@/ui/assemblies/PanelContainer";
import { TopNavigation } from "@/ui/assemblies/TopNavigation";
import type { DesignSystemItem } from "@/lib/data/design-system-items";
import type { CanvasObject } from "@/lib/types";

/**
 * Converts a design system item to a canvas object for insertion
 */
function convertDesignSystemItemToCanvasObject(
  item: DesignSystemItem,
  x: number = 100,
  y: number = 100
): CanvasObject {
  const baseObject = {
    id: `${item.id}-${Date.now()}`,
    name: item.name,
    x,
    y,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 100,
  };

  switch (item.type) {
    case "component":
      return {
        ...baseObject,
        type: "rectangle",
        fill: "#3a3a3a",
        stroke: "#5a5a5a",
        strokeWidth: 2,
        cornerRadius: 8,
        width: 200,
        height: 80,
      } as CanvasObject;

    case "snippet":
      return {
        ...baseObject,
        type: "text",
        text: item.name,
        fontSize: 16,
        fontFamily: "Inter",
        fontWeight: "500",
        textAlign: "left",
        lineHeight: 1.4,
        fill: "#ffffff",
        width: 250,
        height: 60,
      } as CanvasObject;

    case "page":
      return {
        ...baseObject,
        type: "frame",
        fill: "#1a1a1a",
        stroke: "#3a3a3a",
        strokeWidth: 2,
        cornerRadius: 12,
        width: 300,
        height: 200,
        expanded: true,
        children: [
          {
            id: `${item.id}-header-${Date.now()}`,
            type: "text",
            name: "Page Header",
            x: 20,
            y: 20,
            width: 260,
            height: 40,
            rotation: 0,
            visible: true,
            locked: false,
            opacity: 100,
            text: item.name,
            fontSize: 24,
            fontFamily: "Inter",
            fontWeight: "600",
            textAlign: "left",
            lineHeight: 1.2,
            fill: "#ffffff",
          },
        ],
      } as CanvasObject;

    case "icon":
      return {
        ...baseObject,
        type: "rectangle",
        fill: "#2a2a2a",
        stroke: "#4a4a4a",
        strokeWidth: 1,
        cornerRadius: 4,
        width: 32,
        height: 32,
      } as CanvasObject;

    default:
      return {
        ...baseObject,
        type: "rectangle",
        fill: "#2a2a2a",
        stroke: "#4a4a4a",
        strokeWidth: 1,
        cornerRadius: 4,
        width: 150,
        height: 60,
      } as CanvasObject;
  }
}

function DesignEditorContent() {
  const [isDesignSystemOpen, setIsDesignSystemOpen] = useState(false);
  const { addObject } = useCanvas();

  const handleInsertItem = (item: DesignSystemItem) => {
    console.info("Inserting item:", item);

    // Convert DesignSystemItem to CanvasObject
    const canvasObject = convertDesignSystemItemToCanvasObject(item);

    // Add to canvas
    addObject(canvasObject);

    setIsDesignSystemOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content Area - Edge to Edge Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas Area - Full Screen */}
        <CanvasArea />

        {/* Floating Panels */}
        <PanelContainer
          onOpenDesignSystem={() => setIsDesignSystemOpen(true)}
        />

        {/* Context Menu */}
        <ContextMenu />

        {/* Design System Overlay */}
        <DesignSystemOverlay
          isOpen={isDesignSystemOpen}
          onClose={() => setIsDesignSystemOpen(false)}
          onInsert={handleInsertItem}
        />
      </div>

      {/* Floating Action Bar - Outside main content */}
      <ActionBar />
    </div>
  );
}

export default function DesignEditor() {
  return (
    <CanvasProvider>
      <DevTools />
      <GlobalShortcutsProvider>
        <DesignEditorContent />
      </GlobalShortcutsProvider>
    </CanvasProvider>
  );
}
