"use client";

import type React from "react";

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
  return (
    <div
      className={`flex items-center justify-between p-4 border-b border-border ${
        className || ""
      }`}
    >
      <div
        className={`flex flex-col gap-1 ${
          variant === "compact" ? "gap-0" : ""
        }`}
      >
        <h2
          className={`text-sm font-semibold ${
            variant === "compact" ? "text-xs" : ""
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <span
            className={`text-xs text-muted-foreground ${
              variant === "compact" ? "hidden" : ""
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
