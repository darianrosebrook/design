"use client";

import { useMemo } from "react";
import { useCanvas } from "@/lib/canvas-context";

/**
 * Scale bar component for showing pixel measurements
 * Similar to map scale bars, but shows pixel distances
 * Scales with zoom level and maintains readable measurements
 *
 * @author @darianrosebrook
 */
export function ScaleBar() {
  const { zoom } = useCanvas();

  // Calculate appropriate scale based on zoom level
  const scaleData = useMemo(() => {
    const zoomFactor = zoom / 100;

    // Base scale options (in pixels at 100% zoom)
    const baseScales = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000];

    // Find the best scale that results in a bar between 32px and 64px
    for (const baseScale of baseScales) {
      const scaledLength = baseScale * zoomFactor;
      if (scaledLength >= 32 && scaledLength <= 64) {
        return {
          length: scaledLength,
          pixels: baseScale,
          label:
            baseScale >= 1000 ? `${baseScale / 1000}k` : baseScale.toString(),
        };
      }
    }

    // Fallback to closest option
    const closestScale = baseScales.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev * zoomFactor - 48);
      const currDiff = Math.abs(curr * zoomFactor - 48);
      return currDiff < prevDiff ? curr : prev;
    });

    return {
      length: closestScale * zoomFactor,
      pixels: closestScale,
      label:
        closestScale >= 1000
          ? `${closestScale / 1000}k`
          : closestScale.toString(),
    };
  }, [zoom]);

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium">
      <div className="flex items-center gap-2">
        {/* Scale bar visual */}
        <div className="flex items-end">
          <div
            className="bg-foreground h-1"
            style={{ width: `${scaleData.length}px` }}
          />
          <div className="bg-foreground h-2 w-px ml-0.5" />
          <div className="bg-foreground h-1 w-px ml-0.5" />
          <div className="bg-foreground h-2 w-px ml-0.5" />
        </div>

        {/* Scale label */}
        <div className="text-muted-foreground">{scaleData.label}px</div>
      </div>
    </div>
  );
}
