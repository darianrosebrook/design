"use client";

import type React from "react";
import { ChevronRight } from "lucide-react";

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
  return (
    <div className={`${className || ""}`}>
      <button
        onClick={() => onToggle(id)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-accent/50 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
}
