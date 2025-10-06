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
    <div className="p-4 border-b border-border">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Layers & Library</h2>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span>{name}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{layers} layers</span>
          <span>{components} components</span>
          <span>Modified {lastModified}</span>
        </div>
      </div>
    </div>
  );
}
