"use client";

import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useCanvas } from "@/lib/canvas-context";
import { Button } from "@/ui/primitives/Button";

/**
 * Zoom controls component with plus/minus buttons and zoom to fit functionality
 * @author @darianrosebrook
 */
export function ZoomControls() {
  const { zoom, zoomIn, zoomOut, zoomToFit, zoomToSelection } = useCanvas();

  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={zoomOut}
        className="h-8 w-8 p-0"
        title="Zoom Out (Ctrl+-)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <div className="px-2 text-xs font-medium min-w-[3rem] text-center">
        {Math.floor(zoom)}%
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={zoomIn}
        className="h-8 w-8 p-0"
        title="Zoom In (Ctrl+=)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={zoomToFit}
        className="h-8 w-8 p-0"
        title="Zoom to Fit (Shift+1)"
      >
        <Maximize className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={zoomToSelection}
        className="h-8 w-8 p-0"
        title="Zoom to Selection (Shift+2)"
      >
        <div className="h-4 w-4 flex items-center justify-center text-xs font-bold">
          S
        </div>
      </Button>
    </div>
  );
}
