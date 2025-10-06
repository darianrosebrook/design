"use client";

import { Label } from "@paths-design/design-system";
import type React from "react";
import { useState } from "react";
import styles from "./LayoutSection.module.scss";
import { Link2, Unlink } from "@/lib/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";

interface LayoutSectionProps {
  width: number;
  height: number;
  aspectLocked: boolean;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onAspectLockToggle: () => void;
  className?: string;
}

export function LayoutSection({
  width,
  height,
  aspectLocked,
  onWidthChange,
  onHeightChange,
  onAspectLockToggle,
  className,
}: LayoutSectionProps) {
  const aspectRatio = width / height;

  const handleWidthChange = (newWidth: number) => {
    onWidthChange(newWidth);
    if (aspectLocked) {
      const newHeight = newWidth / aspectRatio;
      onHeightChange(newHeight);
    }
  };

  const handleHeightChange = (newHeight: number) => {
    onHeightChange(newHeight);
    if (aspectLocked) {
      const newWidth = newHeight * aspectRatio;
      onWidthChange(newWidth);
    }
  };

  return (
    <div className={cn(styles.layoutSection, className)}>
      <div className={styles.layoutSectionGrid}>
        <div className={styles.layoutSectionField}>
          <Label className={styles.layoutSectionLabel}>Width</Label>
          <Input
            type="number"
            value={Math.round(width)}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            className={styles.layoutSectionInput}
          />
        </div>
        <div className={styles.layoutSectionField}>
          <Label className={styles.layoutSectionLabel}>Height</Label>
          <Input
            type="number"
            value={Math.round(height)}
            onChange={(e) => handleHeightChange(Number(e.target.value))}
            className={styles.layoutSectionInput}
          />
        </div>
      </div>

      <div className={styles.layoutSectionAspectRatio}>
        <Label className={styles.layoutSectionLabel}>Aspect Ratio</Label>
        <div className={styles.layoutSectionAspectRatioControls}>
          <span className={styles.layoutSectionAspectRatioValue}>
            {aspectRatio.toFixed(2)}:1
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAspectLockToggle}
            className={styles.layoutSectionAspectRatioButton}
          >
            {aspectLocked ? (
              <Link2 className={styles.layoutSectionAspectRatioIcon} />
            ) : (
              <Unlink className={styles.layoutSectionAspectRatioIcon} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
