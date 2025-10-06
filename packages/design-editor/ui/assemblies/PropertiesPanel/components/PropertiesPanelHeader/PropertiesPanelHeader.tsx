"use client";

import type React from "react";
import styles from "./PropertiesPanelHeader.module.scss";
import { cn } from "@/lib/utils";

interface PropertiesPanelHeaderProps {
  selectedObjectType?: string;
  className?: string;
}

export function PropertiesPanelHeader({
  selectedObjectType,
  className,
}: PropertiesPanelHeaderProps) {
  return (
    <div className={cn(styles.propertiesPanelHeader, className)}>
      <h2 className={styles.propertiesPanelHeaderTitle}>Properties</h2>
      {selectedObjectType ? (
        <span className={styles.propertiesPanelHeaderType}>
          {selectedObjectType}
        </span>
      ) : (
        <span className={styles.propertiesPanelHeaderType}>Canvas</span>
      )}
    </div>
  );
}
