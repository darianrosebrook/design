"use client";

import { useState } from "react";
import { ActionBar } from "@/ui/assemblies/ActionBar";
import { CanvasArea } from "@/ui/assemblies/CanvasArea";
import { ContextMenu } from "@/ui/primitives/ContextMenu";
import { DesignSystemOverlay } from "@/ui/assemblies/DesignSystemOverlay";
import { PanelContainer } from "@/ui/assemblies/PanelContainer";
import { TopNavigation } from "@/ui/assemblies/TopNavigation";
import { CanvasProvider } from "@/lib/canvas-context";
import { GlobalShortcutsProvider } from "@/lib/global-shortcuts-provider";
import { DevTools } from "@/lib/dev-tools";

export default function DesignEditor() {
  const [isDesignSystemOpen, setIsDesignSystemOpen] = useState(false);

  const handleInsertItem = (item: any) => {
    console.log("Inserting item:", item);
    // TODO: Implement actual insertion logic
    setIsDesignSystemOpen(false);
  };

  return (
    <CanvasProvider>
      <DevTools />
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
