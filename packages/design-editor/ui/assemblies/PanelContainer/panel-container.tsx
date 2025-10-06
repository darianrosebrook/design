"use client";

import React, { useState, useEffect } from "react";
import { useCanvas } from "@/lib/canvas-context";
import { FileDetailsPanel } from "@/ui/assemblies/FileDetailsPanel";
import { PropertiesPanel } from "@/ui/assemblies/PropertiesPanel";
import { PropertiesPanelCollapsed } from "@/ui/assemblies/PropertiesPanelCollapsed";
import { CollapsiblePanel } from "@/ui/composers/CollapsiblePanel";
import { ResizablePanel } from "@/ui/composers/ResizablePanel";

interface PanelContainerProps {
  onOpenDesignSystem?: () => void;
}

export function PanelContainer({ onOpenDesignSystem }: PanelContainerProps) {
  const { document, selectedId } = useCanvas();
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Safely find the selected object with error handling
  const selectedObject = React.useMemo(() => {
    if (!selectedId || !document) return null;
    try {
      // Find object in document structure
      const findInChildren = (children: any[]): any => {
        for (const child of children) {
          if (child.id === selectedId) return child;
          if (child.children) {
            const found = findInChildren(child.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findInChildren(document.artboards[0]?.children || []);
    } catch (error) {
      console.warn("Error finding selected object:", error);
      return null;
    }
  }, [selectedId, document]);

  // Keyboard shortcuts for panel toggling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Tab: toggle left panel
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        setLeftPanelCollapsed(!leftPanelCollapsed);
      }
      // Shift+Tab: toggle right panel
      else if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        setRightPanelCollapsed(!rightPanelCollapsed);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leftPanelCollapsed, rightPanelCollapsed]);

  return (
    <>
      {/* Left Panel - Layers */}
      <div className="absolute left-4 top-16 bottom-0">
        <CollapsiblePanel
          side="left"
          defaultCollapsed={leftPanelCollapsed}
          onToggle={setLeftPanelCollapsed}
          collapsedContent={<FileDetailsPanel isCollapsed={true} />}
        >
          <ResizablePanel
            defaultWidth={280}
            minWidth={200}
            maxWidth={400}
            side="left"
          >
            <FileDetailsPanel onOpenDesignSystem={onOpenDesignSystem} />
          </ResizablePanel>
        </CollapsiblePanel>
      </div>

      {/* Right Panel - Properties */}
      <div className="absolute right-4 top-16 bottom-0">
        <CollapsiblePanel
          side="right"
          defaultCollapsed={rightPanelCollapsed}
          onToggle={setRightPanelCollapsed}
          collapsedContent={
            <PropertiesPanelCollapsed
              selectedObjectType={selectedObject?.type}
              selectedObjectName={selectedObject?.name}
              hasSelection={!!selectedObject}
            />
          }
        >
          <ResizablePanel
            defaultWidth={320}
            minWidth={240}
            maxWidth={480}
            side="right"
          >
            <PropertiesPanel />
          </ResizablePanel>
        </CollapsiblePanel>
      </div>
    </>
  );
}
