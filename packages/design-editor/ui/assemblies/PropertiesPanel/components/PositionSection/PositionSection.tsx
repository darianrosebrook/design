"use client";

import { Label } from "@paths-design/design-system";
import type React from "react";
import styles from "./PositionSection.module.scss";
import { cn } from "@/lib/utils";
import { Input } from "@/ui/primitives/Input";

interface PositionSectionProps {
  x: number;
  y: number;
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
  className?: string;
}

export function PositionSection({
  x,
  y,
  onXChange,
  onYChange,
  className,
}: PositionSectionProps) {
  return (
    <div className={cn(styles.positionSection, className)}>
      <div className={styles.positionSectionGrid}>
        <div className={styles.positionSectionField}>
          <Label className={styles.positionSectionLabel}>X</Label>
          <Input
            type="number"
            value={x}
            onChange={(e) => onXChange(Number(e.target.value))}
            className={styles.positionSectionInput}
          />
        </div>
        <div className={styles.positionSectionField}>
          <Label className={styles.positionSectionLabel}>Y</Label>
          <Input
            type="number"
            value={y}
            onChange={(e) => onYChange(Number(e.target.value))}
            className={styles.positionSectionInput}
          />
        </div>
      </div>
    </div>
  );
}
