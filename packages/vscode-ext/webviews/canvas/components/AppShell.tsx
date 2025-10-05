// src/webviews/ui/AppShell.tsx
import React from "react";
import { CanvasProvider } from "../lib/canvas-context";
import { ActionBar } from "./action-bar";
import { CanvasArea } from "./CanvasArea";
import { LayersPanel } from "./layers-panel";
import { PropertiesPanel } from "./properties-panel";
import { ResizablePanel } from "./resizable-panel";
import { TopNavigation } from "./top-navigation";

export function AppShell() {
  return (
    <CanvasProvider>
      <div className="h-screen flex flex-col bg-background dark">
        {/* Top Navigation */}
        <TopNavigation />

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Left Panel - Layers */}
          <ResizablePanel
            defaultWidth={280}
            minWidth={200}
            maxWidth={400}
            side="left"
          >
            <LayersPanel />
          </ResizablePanel>

          {/* Center Canvas */}
          <CanvasArea />

          {/* Right Panel - Properties */}
          <ResizablePanel
            defaultWidth={320}
            minWidth={240}
            maxWidth={480}
            side="right"
          >
            <PropertiesPanel />
          </ResizablePanel>
        </div>

        {/* Floating Action Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card border border-border rounded-2xl shadow-2xl px-2 py-2">
            <ActionBar />
          </div>
        </div>
      </div>
    </CanvasProvider>
  );
}
