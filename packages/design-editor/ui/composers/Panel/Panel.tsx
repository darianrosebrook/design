"use client";

import type React from "react";
import styles from "./Panel.module.scss";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return <div className={`${styles.panel} ${className || ""}`}>{children}</div>;
}
