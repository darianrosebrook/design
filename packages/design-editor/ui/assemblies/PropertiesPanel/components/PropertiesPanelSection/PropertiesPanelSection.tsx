"use client";

import type React from "react";
import { ChevronRight, GripVertical } from "lucide-react";
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
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => onToggle(id)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-accent/50 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform",
            expanded && "rotate-90"
          )}
        />
      </button>
      {expanded && <div className="ml-6">{children}</div>}
    </div>
  );
}
