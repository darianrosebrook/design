"use client";

import { LayersIcon, Library } from "lucide-react";
import { useState } from "react";
import styles from "./file-details-panel.module.scss";
import { useCanvas } from "@/lib/canvas-context";
import { cn } from "@/lib/utils";
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
      <div className={styles.fileDetailsPanelCollapsed}>
        <div className={styles.fileDetailsPanelCollapsedName}>
          {fileMetadata.name}
        </div>
        <div className={styles.fileDetailsPanelCollapsedStats}>
          <LayersIcon className={styles.fileDetailsPanelCollapsedIcon} />
          <span>{fileMetadata.layers}</span>
        </div>
        <div className={styles.fileDetailsPanelCollapsedTime}>
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
          className={styles.fileDetailsPanelTabs}
        >
          <TabsList className="// grid w-full grid-cols-2 mx-3 mt-2 h-9">
            <TabsTrigger value="layers" className="// text-xs">
              <LayersIcon className="// h-3 w-3 mr-1" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="library" className="// text-xs">
              <Library className="// h-3 w-3 mr-1" />
              Library
            </TabsTrigger>
          </TabsList>

          {/* Layers Tab */}
          <TabsContent value="layers" className="// flex-1 m-0">
            <LayersList objects={objects} />
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="// flex-1 m-0">
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
