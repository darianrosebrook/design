"use client";

import type React from "react";
import styles from "./PropertiesPanelSection.module.scss";
import { ChevronRight, GripVertical } from "@/lib/components/icons";
import { cn } from "@/lib/utils";

interface PropertiesPanelSectionProps {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function PropertiesPanelSection({
  id,
  title,
  expanded,
  onToggle,
  children,
  className,
}: PropertiesPanelSectionProps) {
  return (
    <div className={cn(styles.propertiesPanelSection, className)}>
      <button
        onClick={() => onToggle(id)}
        className={styles.propertiesPanelSectionHeader}
      >
        <div className={styles.propertiesPanelSectionHeaderContent}>
          <GripVertical className={styles.propertiesPanelSectionGrip} />
          <span>{title}</span>
        </div>
        <ChevronRight
          className={cn(
            styles.propertiesPanelSectionChevron,
            expanded && styles["propertiesPanelSectionChevron--expanded"]
          )}
        />
      </button>
      {expanded && (
        <div className={styles.propertiesPanelSectionContent}>{children}</div>
      )}
    </div>
  );
}
