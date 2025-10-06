"use client";

import { useState } from "react";
import { CanvasProvider } from "@/lib/canvas-context";
import { DevTools } from "@/lib/dev-tools";
import { GlobalShortcutsProvider } from "@/lib/global-shortcuts-provider";
import { ActionBar } from "@/ui/assemblies/ActionBar";
import { CanvasArea } from "@/ui/assemblies/CanvasArea";
import { ContextMenu } from "@/ui/assemblies/ContextMenu";
import { DesignSystemOverlay } from "@/ui/assemblies/DesignSystemOverlay";
import { PanelContainer } from "@/ui/assemblies/PanelContainer";
import { TopNavigation } from "@/ui/assemblies/TopNavigation";

export default function DesignEditor() {
  const [isDesignSystemOpen, setIsDesignSystemOpen] = useState(false);

  const handleInsertItem = (item: unknown) => {
    console.info("Inserting item:", item);
    // TODO: Implement actual insertion logic
    setIsDesignSystemOpen(false);
  };

  return (
    <CanvasProvider>
      <DevTools />
      <GlobalShortcutsProvider>
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
      </GlobalShortcutsProvider>
    </CanvasProvider>
  );
}
