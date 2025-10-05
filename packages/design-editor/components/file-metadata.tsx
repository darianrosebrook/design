"use client";

import { Info } from "lucide-react";

interface FileMetadataProps {
  name: string;
  layers: number;
  components: number;
  lastModified: string;
}

export function FileMetadata({
  name,
  layers,
  components,
  lastModified,
}: FileMetadataProps) {
  return (
    <div className="px-3 py-2 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Layers & Library</h2>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <Info className="h-3 w-3" />
          <span>{name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{layers} layers</span>
          <span>{components} components</span>
          <span>Modified {lastModified}</span>
        </div>
      </div>
    </div>
  );
}
