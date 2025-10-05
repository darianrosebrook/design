"use client";

import { useState } from "react";
import { ActionBar } from "@/components/action-bar";
import { CanvasArea } from "@/components/canvas-area";
import { ContextMenu } from "@/components/context-menu";
import { DesignSystemOverlay } from "@/components/design-system-overlay";
import { PanelContainer } from "@/components/panel-container";
import { TopNavigation } from "@/components/top-navigation";
import { CanvasProvider } from "@/lib/canvas-context";
import { GlobalShortcutsProvider } from "@/lib/global-shortcuts-provider";

export default function DesignEditor() {
  const [isDesignSystemOpen, setIsDesignSystemOpen] = useState(false);

  const handleInsertItem = (item: any) => {
    console.log("Inserting item:", item);
    // TODO: Implement actual insertion logic
    setIsDesignSystemOpen(false);
  };

  return (
    <CanvasProvider>
      <GlobalShortcutsProvider>
        <div className="h-screen flex flex-col bg-background dark relative">
          {/* Top Navigation */}
          <TopNavigation />

          {/* Full-screen Canvas Background */}
          <div className="absolute inset-0 top-12">
            <CanvasArea />
          </div>

          {/* Overlay Panels */}
          <PanelContainer
            onOpenDesignSystem={() => setIsDesignSystemOpen(true)}
          />

          {/* Floating Action Bar */}
          <ActionBar />

          {/* Context Menu */}
          <ContextMenu />

          {/* Design System Overlay */}
          <DesignSystemOverlay
            isOpen={isDesignSystemOpen}
            onClose={() => setIsDesignSystemOpen(false)}
            onInsert={handleInsertItem}
          />
        </div>
      </GlobalShortcutsProvider>
    </CanvasProvider>
  );
}
