"use client";

import { LayersIcon, Library } from "lucide-react";
import { useState } from "react";
import { useCanvas } from "@/lib/canvas-context";
import { LayersList } from "@/ui/assemblies/LayersList";
import { LibrarySection } from "@/ui/assemblies/LibrarySection";
import { Panel, PanelContent } from "@/ui/composers/Panel";
import { FileMetadata } from "@/ui/compounds/FileMetadata";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/primitives/Tabs";

interface FileDetailsPanelProps {
  onOpenDesignSystem?: () => void;
  isCollapsed?: boolean;
}

export function FileDetailsPanel({
  onOpenDesignSystem,
  isCollapsed = false,
}: FileDetailsPanelProps) {
  const { objects } = useCanvas();
  const [activeTab, setActiveTab] = useState<"layers" | "library">("layers");

  // File metadata
  const fileMetadata = {
    name: "Design System",
    lastModified: "2 hours ago",
    layers: objects.length,
    components: 4, // Mock data for now
  };

  // If collapsed, show compact view
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 p-3 text-center">
        <div className="text-sm font-medium truncate w-full">
          {fileMetadata.name}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <LayersIcon className="h-3 w-3" />
          <span>{fileMetadata.layers}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {fileMetadata.lastModified}
        </div>
      </div>
    );
  }

  return (
    <Panel>
      {/* Header with file metadata */}
      <FileMetadata {...fileMetadata} />

      {/* Content with tabs */}
      <PanelContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "layers" | "library")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layers" className="flex items-center gap-2">
              <LayersIcon className="h-4 w-4" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Library
            </TabsTrigger>
          </TabsList>

          {/* Layers Tab */}
          <TabsContent value="layers" className="mt-4">
            <LayersList objects={objects} />
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="mt-4">
            <LibrarySection
              title="Design System"
              items={[]} // MOCK DATA: Library section will use internal mock data for demonstration
              onOpenDesignSystem={onOpenDesignSystem}
            />
          </TabsContent>
        </Tabs>
      </PanelContent>
    </Panel>
  );
}
