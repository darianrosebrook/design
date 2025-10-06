"use client";

import type React from "react";
import styles from "./Panel.module.scss";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: "default" | "compact";
  className?: string;
}

export function PanelHeader({
  title,
  subtitle,
  actions,
  variant = "default",
  className,
}: PanelHeaderProps) {
  const variantClass = variant === "compact" ? styles.panelHeader_compact : "";
  return (
    <div className={`${styles.panelHeader} ${variantClass} ${className || ""}`}>
      <div className={styles.panelHeaderContent}>
        <h2 className={styles.panelHeaderTitle}>{title}</h2>
        {subtitle && (
          <span className={styles.panelHeaderSubtitle}>{subtitle}</span>
        )}
      </div>
      {actions && <div className={styles.panelHeaderActions}>{actions}</div>}
    </div>
  );
}
