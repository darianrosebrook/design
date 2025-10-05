"use client";

import type React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertySectionProps {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function PropertySection({
  id,
  title,
  expanded,
  onToggle,
  children,
  className,
  icon,
}: PropertySectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 group"
      >
        <div className="flex items-center gap-1">
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground/60" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground/60" />
          )}
          {icon}
          <span>{title}</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 pl-4 border-l border-border/50">
          {children}
        </div>
      )}
    </div>
  );
}

export interface PropertySectionData {
  id: string;
  title: string;
  expanded: boolean;
  icon?: React.ReactNode;
}
