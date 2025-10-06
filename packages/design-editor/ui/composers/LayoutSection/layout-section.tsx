"use client";

import { Label } from "@paths-design/design-system";
import {
  Link2,
  Unlink,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  ArrowLeftRight,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import styles from "./layout-section.module.scss";
import type { CanvasObject } from "@/lib/types";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { Switch } from "@/ui/primitives/Switch";

interface LayoutSectionProps {
  object: CanvasObject;
  onUpdate: (updates: Partial<CanvasObject>) => void;
}

export function LayoutSection({ object, onUpdate }: LayoutSectionProps) {
  const [aspectLocked, setAspectLocked] = useState(true);
  const [autoLayout, setAutoLayout] = useState(false);

  const handleDimensionChange = (
    dimension: "width" | "height",
    value: number
  ) => {
    const updates: Partial<CanvasObject> = { [dimension]: value };

    if (aspectLocked && dimension === "width") {
      const aspectRatio = object.height / object.width;
      updates.height = value * aspectRatio;
    } else if (aspectLocked && dimension === "height") {
      const aspectRatio = object.width / object.height;
      updates.width = value * aspectRatio;
    }

    onUpdate(updates);
  };

  const handleRotationChange = (rotation: number) => {
    onUpdate({ rotation });
  };

  const resetRotation = () => {
    onUpdate({ rotation: 0 });
  };

  const toggleAutoLayout = () => {
    setAutoLayout(!autoLayout);
    // TODO: Implement auto layout logic
  };

  return (
    <div className={styles.layoutSection}>
      {/* Layout Mode Toggle */}
      <div className={styles.layoutModeToggle}>
        <div className={styles.layoutModeToggleContent}>
          <Label className={styles.layoutModeToggleLabel}>Auto Layout</Label>
          <Switch
            checked={autoLayout}
            onCheckedChange={toggleAutoLayout}
            className={styles.layoutModeToggleSwitch}
          />
        </div>
        {autoLayout && (
          <div className={styles.layoutModeButtons}>
            <Button
              variant="outline"
              size="sm"
              className={styles.resizeButton}
              title="Horizontal"
            >
              <ArrowLeftRight className={styles.resizeButtonIcon} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={styles.resizeButton}
              title="Vertical"
            >
              <ArrowUpDown className={styles.resizeButtonIcon} />
            </Button>
          </div>
        )}
      </div>

      {/* Dimensions */}
      <div className={styles.dimensionsSection}>
        <div className={styles.dimensionsHeader}>
          <Label className={styles.dimensionsLabel}>Size</Label>
          <Button
            variant="ghost"
            size="icon"
            className={styles.aspectLockButton}
            onClick={() => setAspectLocked(!aspectLocked)}
            title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
          >
            {aspectLocked ? (
              <Link2 className={styles.aspectLockIcon} />
            ) : (
              <Unlink className={styles.aspectLockIcon} />
            )}
          </Button>
        </div>

        <div className={styles.dimensionsGrid}>
          <div className={styles.dimensionInputGroup}>
            <Label className={styles.dimensionLabel}>W</Label>
            <Input
              type="number"
              value={object.width}
              onChange={(e) =>
                handleDimensionChange("width", Number(e.target.value))
              }
              className={styles.dimensionInput}
              step="0.1"
            />
          </div>

          <div className={styles.aspectLockCenter}>
            <Button
              variant="ghost"
              size="icon"
              className={styles.aspectLockButton}
              onClick={() => setAspectLocked(!aspectLocked)}
              title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {aspectLocked ? (
                <Link2 className={styles.aspectLockIcon} />
              ) : (
                <Unlink className={styles.aspectLockIcon} />
              )}
            </Button>
          </div>

          <div className={styles.dimensionInputGroup}>
            <Label className={styles.dimensionLabel}>H</Label>
            <Input
              type="number"
              value={object.height}
              onChange={(e) =>
                handleDimensionChange("height", Number(e.target.value))
              }
              className={styles.dimensionInput}
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Resize Mode */}
      <div className={styles.resizeSection}>
        <Label className={styles.resizeLabel}>Resize</Label>
        <div className={styles.resizeGrid}>
          <Button
            variant="outline"
            size="sm"
            className={styles.resizeButton}
            title="Fill container"
          >
            <Maximize2 className={styles.resizeButtonIcon} />
            Fill
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={styles.resizeButton}
            title="Hug contents"
          >
            <Minimize2 className={styles.resizeButtonIcon} />
            Hug
          </Button>
        </div>
      </div>

      {/* Rotation */}
      <div className={styles.rotationSection}>
        <div className={styles.rotationHeader}>
          <Label className={styles.rotationLabel}>Rotation</Label>
          <Button
            variant="ghost"
            size="icon"
            className={styles.rotationResetButton}
            onClick={resetRotation}
            title="Reset rotation"
          >
            <RotateCcw className={styles.rotationResetIcon} />
          </Button>
        </div>
        <div className={styles.rotationControls}>
          <Input
            type="number"
            value={object.rotation}
            onChange={(e) => handleRotationChange(Number(e.target.value))}
            className={styles.rotationInput}
            step="0.1"
            min="-360"
            max="360"
          />
          <span className={styles.rotationUnit}>°</span>
        </div>
      </div>

      {/* Constraints */}
      <div className={styles.constraintsSection}>
        <Label className={styles.constraintsLabel}>Constraints</Label>
        <div className={styles.constraintsGrid}>
          <div className={styles.constraintGroup}>
            <Label className={styles.constraintLabel}>Horizontal</Label>
            <div className={styles.constraintButtons}>
              <Button
                variant="outline"
                size="sm"
                className={styles.constraintButton}
                title="Left"
              >
                L
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={styles.constraintButton}
                title="Center"
              >
                C
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={styles.constraintButton}
                title="Right"
              >
                R
              </Button>
            </div>
          </div>
          <div className={styles.constraintGroup}>
            <Label className={styles.constraintLabel}>Vertical</Label>
            <div className={styles.constraintButtons}>
              <Button
                variant="outline"
                size="sm"
                className={styles.constraintButton}
                title="Top"
              >
                T
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={styles.constraintButton}
                title="Center"
              >
                C
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={styles.constraintButton}
                title="Bottom"
              >
                B
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Clip Content */}
      <div className={styles.clipContentSection}>
        <Label className={styles.clipContentLabel}>Clip content</Label>
        <Switch
          checked={object.clipContent || false}
          onCheckedChange={(checked) => onUpdate({ clipContent: checked })}
          className={styles.clipContentSwitch}
        />
      </div>
    </div>
  );
}
