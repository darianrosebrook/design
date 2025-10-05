"use client";

import { useState } from "react";
import { LayersIcon, Library } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/primitives/Tabs";
import { FileMetadata } from "@/ui/compounds/file-metadata";
import { LayersList } from "@/ui/assemblies/layers-list";
import { LibrarySection } from "@/ui/assemblies/library-section";
import { useCanvas } from "@/lib/canvas-context";

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
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="text-xs font-medium text-foreground truncate max-w-[80px]">
          {fileMetadata.name}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <LayersIcon className="h-3 w-3" />
          <span>{fileMetadata.layers}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate max-w-[70px]">
          {fileMetadata.lastModified}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with file metadata */}
      <FileMetadata {...fileMetadata} />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "layers" | "library")}
      >
        <TabsList className="grid w-full grid-cols-2 mx-3 mt-2 h-9">
          <TabsTrigger value="layers" className="text-xs">
            <LayersIcon className="h-3 w-3 mr-1" />
            Layers
          </TabsTrigger>
          <TabsTrigger value="library" className="text-xs">
            <Library className="h-3 w-3 mr-1" />
            Library
          </TabsTrigger>
        </TabsList>

        {/* Layers Tab */}
        <TabsContent value="layers" className="flex-1 m-0">
          <LayersList objects={objects} />
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="flex-1 m-0">
          <LibrarySection
            title="Design System"
            items={[]} // MOCK DATA: Library section will use internal mock data for demonstration
            onOpenDesignSystem={onOpenDesignSystem}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
