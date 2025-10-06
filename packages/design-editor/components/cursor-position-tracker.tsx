"use client";

import { useCanvas } from "@/lib/canvas-context";

/**
 * Cursor position tracker component
 * Displays current cursor position and viewport coordinates
 *
 * @author @darianrosebrook
 */
export function CursorPositionTracker() {
  const { cursorX, cursorY, viewportX, viewportY } = useCanvas();

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium">
      <div>
        Cursor: {Math.round(cursorX)}, {Math.round(cursorY)}
      </div>
      <div>
        Viewport: {Math.round(viewportX)}, {Math.round(viewportY)}
      </div>
    </div>
  );
}
