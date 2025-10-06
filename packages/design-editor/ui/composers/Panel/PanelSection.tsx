"use client";

import type React from "react";
import styles from "./Panel.module.scss";
import { ChevronRight } from "@/lib/components/icons";

interface PanelSectionProps {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PanelSection({
  id,
  title,
  expanded,
  onToggle,
  children,
  icon,
  actions,
  className,
}: PanelSectionProps) {
  const chevronClass = expanded
    ? `${styles.panelSectionChevron} ${styles["panelSectionChevron--expanded"]}`
    : styles.panelSectionChevron;

  return (
    <div className={`${styles.panelSection} ${className || ""}`}>
      <button
        onClick={() => onToggle(id)}
        className={styles.panelSectionHeader}
      >
        <div className={styles.panelSectionHeaderContent}>
          {icon && <div className={styles.panelSectionIcon}>{icon}</div>}
          <span className={styles.panelSectionTitle}>{title}</span>
        </div>
        <div className={styles.panelSectionHeaderEnd}>
          {actions}
          <ChevronRight className={chevronClass} />
        </div>
      </button>
      {expanded && <div className={styles.panelSectionContent}>{children}</div>}
    </div>
  );
}
