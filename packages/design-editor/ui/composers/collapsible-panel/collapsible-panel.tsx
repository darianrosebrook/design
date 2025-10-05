"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/ui/primitives/Button";
import { cn } from "@/lib/utils";
import styles from "./collapsible-panel.module.scss";

interface CollapsiblePanelProps {
  children: React.ReactNode;
  side: "left" | "right";
  defaultCollapsed?: boolean;
  collapsedContent?: React.ReactNode;
  onToggle?: (collapsed: boolean) => void;
  className?: string;
}

export function CollapsiblePanel({
  children,
  side: _side,
  defaultCollapsed = false,
  collapsedContent,
  onToggle,
  className = "",
}: CollapsiblePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  return (
    <div className={cn(styles.collapsiblePanel, className)}>
      {/* Panel Container */}
      <div
        className={cn(
          styles.collapsiblePanelContainer,
          isCollapsed
            ? styles["collapsiblePanelContainer--collapsed"]
            : styles["collapsiblePanelContainer--expanded"]
        )}
      >
        {/* Main Content */}
        <div
          className={cn(
            styles.collapsiblePanelContent,
            isCollapsed
              ? styles["collapsiblePanelContent--collapsed"]
              : styles["collapsiblePanelContent--expanded"]
          )}
        >
          {children}
        </div>

        {/* Collapsed Content */}
        <div
          className={cn(
            styles.collapsiblePanelCollapsedContent,
            isCollapsed
              ? styles["collapsiblePanelCollapsedContent--visible"]
              : styles["collapsiblePanelCollapsedContent--hidden"]
          )}
        >
          {collapsedContent}
        </div>

        {/* Toggle Button - Inside Panel Header */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={styles.collapsiblePanelToggle}
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          {isCollapsed ? (
            <ChevronDown className={styles.collapsiblePanelToggleIcon} />
          ) : (
            <ChevronUp className={styles.collapsiblePanelToggleIcon} />
          )}
        </Button>
      </div>
    </div>
  );
}
