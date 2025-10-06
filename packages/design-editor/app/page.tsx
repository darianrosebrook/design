"use client";

import { useState } from "react";
import { CanvasProvider, useCanvas } from "@/lib/canvas-context";
import { DevTools } from "@/lib/dev-tools";
import { GlobalShortcutsProvider } from "@/lib/global-shortcuts-provider";
import type { DesignSystemItem } from "@/lib/data/design-system-items";
import type { CanvasObject } from "@/lib/types";
import { ActionBar } from "@/ui/assemblies/ActionBar";
import { CanvasArea } from "@/ui/assemblies/CanvasArea";
import { ContextMenu } from "@/ui/assemblies/ContextMenu";
import { DesignSystemOverlay } from "@/ui/assemblies/DesignSystemOverlay";
import { PanelContainer } from "@/ui/assemblies/PanelContainer";
import { TopNavigation } from "@/ui/assemblies/TopNavigation";
// import { ColorPicker } from "@/ui/assemblies/ColorPicker"; // TODO: Fix import paths

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

interface DesignEditorContentProps {
  isUIToggled: boolean;
  onUIToggle: () => void;
  isColorPickerOpen: boolean;
  currentColor: string;
  onColorChange: (color: string) => void;
  onColorPickerClose: () => void;
  isGlobalSearchOpen: boolean;
  onGlobalSearchClose: () => void;
}

function DesignEditorContent({
  isUIToggled,
  onUIToggle: _onUIToggle,
  isColorPickerOpen: _isColorPickerOpen,
  currentColor: _currentColor,
  onColorChange: _onColorChange,
  onColorPickerClose: _onColorPickerClose,
  isGlobalSearchOpen,
  onGlobalSearchClose: _onGlobalSearchClose,
}: DesignEditorContentProps) {
  const [isDesignSystemOpen, setIsDesignSystemOpen] = useState(false);
  const {
    addObject,
    updateObject: _updateObject,
    selectedId: _selectedId,
    objects: _objects,
  } = useCanvas();

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
      {isUIToggled && <TopNavigation />}

      {/* Main Content Area - Edge to Edge Canvas */}
      <div
        className={`flex-1 relative overflow-hidden ${
          !isUIToggled ? "pt-0" : ""
        }`}
      >
        {/* Canvas Area - Full Screen */}
        <CanvasArea />

        {/* Floating Panels */}
        {isUIToggled && (
          <PanelContainer
            onOpenDesignSystem={() => setIsDesignSystemOpen(true)}
          />
        )}

        {/* Context Menu */}
        <ContextMenu />

        {/* Design System Overlay */}
        <DesignSystemOverlay
          isOpen={isDesignSystemOpen}
          onClose={() => setIsDesignSystemOpen(false)}
          onInsert={handleInsertItem}
        />

        {/* Global Search Modal */}
        {isGlobalSearchOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search components, actions, settings..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      handleGlobalSearchClose();
                    }
                  }}
                />
                <div className="mt-4 text-sm text-gray-500">
                  Press ESC to close
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color Picker */}
        {/* <ColorPicker
          color={currentColor}
          onChange={handleColorChangeWithUpdate}
          selectedObject={
            selectedId
              ? objects.find((obj) => obj.id === selectedId) || null
              : null
          }
        /> */}
      </div>

      {/* Floating Action Bar - Outside main content */}
      {isUIToggled && <ActionBar />}
    </div>
  );
}

function DesignEditorWithShortcuts() {
  const [isUIToggled, setIsUIToggled] = useState(true);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const handleUIToggle = useCallback(() => {
    setIsUIToggled((prev) => !prev);
  }, []);

  const handleColorPickerOpen = useCallback(() => {
    setIsColorPickerOpen(true);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color);
  }, []);

  const handleColorPickerClose = useCallback(() => {
    setIsColorPickerOpen(false);
  }, []);

  const handleGlobalSearchOpen = useCallback(() => {
    setIsGlobalSearchOpen(true);
  }, []);

  const handleGlobalSearchClose = useCallback(() => {
    setIsGlobalSearchOpen(false);
  }, []);

  return (
    <GlobalShortcutsProvider
      onUIToggle={handleUIToggle}
      onColorPickerOpen={handleColorPickerOpen}
      onGlobalSearchOpen={handleGlobalSearchOpen}
    >
      <DesignEditorContent
        isUIToggled={isUIToggled}
        onUIToggle={handleUIToggle}
        isColorPickerOpen={isColorPickerOpen}
        currentColor={currentColor}
        onColorChange={handleColorChange}
        onColorPickerClose={handleColorPickerClose}
        isGlobalSearchOpen={isGlobalSearchOpen}
        onGlobalSearchClose={handleGlobalSearchClose}
      />
    </GlobalShortcutsProvider>
  );
}

export default function DesignEditor() {
  return (
    <CanvasProvider>
      <DevTools />
      <DesignEditorWithShortcuts />
    </CanvasProvider>
  );
}
