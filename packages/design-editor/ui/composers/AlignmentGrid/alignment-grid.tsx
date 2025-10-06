"use client";

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignHorizontalJustifyCenter,
} from "lucide-react";
import type React from "react";
import styles from "./alignment-grid.module.scss";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/primitives/Button";

interface AlignmentGridProps {
  onAlign: (alignment: string) => void;
  currentAlignment?: {
    horizontal?: "left" | "center" | "right";
    vertical?: "top" | "middle" | "bottom";
  };
}

export function AlignmentGrid({
  onAlign,
  currentAlignment,
}: AlignmentGridProps) {
  const horizontalAlignments = [
    { key: "left", icon: AlignLeft, label: "Align Left" },
    { key: "center", icon: AlignCenter, label: "Align Center" },
    { key: "right", icon: AlignRight, label: "Align Right" },
  ];

  const verticalAlignments = [
    { key: "top", icon: AlignVerticalJustifyStart, label: "Align Top" },
    { key: "middle", icon: AlignVerticalJustifyCenter, label: "Align Middle" },
    { key: "bottom", icon: AlignVerticalJustifyEnd, label: "Align Bottom" },
  ];

  return (
    <div className={styles.alignmentGrid}>
      <div className={styles.alignmentGridTitle}>Alignment</div>

      {/* Horizontal Alignment */}
      <div className={styles.alignmentGridRow}>
        {horizontalAlignments.map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            variant={
              currentAlignment?.horizontal === key ? "default" : "outline"
            }
            size="sm"
            className={styles.alignmentGridButton}
            onClick={() => onAlign(`horizontal-${key}`)}
            title={label}
          >
            <Icon className={styles.alignmentGridIcon} />
          </Button>
        ))}
      </div>

      {/* Vertical Alignment */}
      <div className={styles.alignmentGridRow}>
        {verticalAlignments.map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            variant={currentAlignment?.vertical === key ? "default" : "outline"}
            size="sm"
            className={styles.alignmentGridButton}
            onClick={() => onAlign(`vertical-${key}`)}
            title={label}
          >
            <Icon className={styles.alignmentGridIcon} />
          </Button>
        ))}
      </div>

      {/* Distribution */}
      <div className={styles.alignmentGridDistribution}>
        <div className={styles.alignmentGridDistributionTitle}>
          Distribution
        </div>
        <div className={styles.alignmentGridRow}>
          <Button
            variant="outline"
            size="sm"
            className={styles.alignmentGridButton}
            onClick={() => onAlign("distribute-horizontal")}
            title="Distribute Horizontally"
          >
            <AlignHorizontalJustifyCenter
              className={styles.alignmentGridIcon}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={styles.alignmentGridButton}
            onClick={() => onAlign("distribute-vertical")}
            title="Distribute Vertically"
          >
            <AlignVerticalJustifyCenter className={styles.alignmentGridIcon} />
          </Button>
        </div>
      </div>
    </div>
  );
}
