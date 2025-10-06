"use client";

import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import styles from "./zoom-controls.module.scss";
import { useCanvas } from "@/lib/canvas-context";
import { Button } from "@/ui/primitives/Button";

/**
 * Zoom controls component with plus/minus buttons and zoom to fit functionality
 * @author @darianrosebrook
 */
export function ZoomControls() {
  const { zoom, zoomIn, zoomOut, zoomToFit, zoomToSelection } = useCanvas();

  return (
    <div className={styles.zoomControls}>
      <Button
        variant="ghost"
        size="sm"
        onClick={zoomOut}
        className={styles.zoomControlsButton}
        title="Zoom Out (Ctrl+-)"
      >
        <ZoomOut className={styles.zoomControlsIcon} />
      </Button>

      <div className={styles.zoomControlsDisplay}>{Math.floor(zoom)}%</div>

      <Button
        variant="ghost"
        size="sm"
        onClick={zoomIn}
        className={styles.zoomControlsButton}
        title="Zoom In (Ctrl+=)"
      >
        <ZoomIn className={styles.zoomControlsIcon} />
      </Button>

      <div className={styles.zoomControlsSeparator} />

      <Button
        variant="ghost"
        size="sm"
        onClick={zoomToFit}
        className={styles.zoomControlsButton}
        title="Zoom to Fit (Shift+1)"
      >
        <Maximize className={styles.zoomControlsIcon} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={zoomToSelection}
        className={styles.zoomControlsButton}
        title="Zoom to Selection (Shift+2)"
      >
        <div className={styles.zoomControlsSelectionIcon}>S</div>
      </Button>
    </div>
  );
}
