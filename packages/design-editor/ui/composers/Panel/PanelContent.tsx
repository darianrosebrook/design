"use client";

import type React from "react";
import styles from "./Panel.module.scss";

interface PanelContentProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export function PanelContent({
  children,
  scrollable = false,
  padding = "md",
  className,
}: PanelContentProps) {
  const paddingClass = styles[`panelContent--padding-${padding}`];
  const scrollableClass = scrollable ? styles["panelContent--scrollable"] : "";
  const contentClass = `${
    styles.panelContent
  } ${paddingClass} ${scrollableClass} ${className || ""}`;

  if (scrollable) {
    return (
      <div className={contentClass}>
        <div className={styles.panelContentScrollArea}>{children}</div>
      </div>
    );
  }

  return <div className={contentClass}>{children}</div>;
}
