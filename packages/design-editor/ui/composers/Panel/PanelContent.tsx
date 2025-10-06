"use client";

import type React from "react";
import { ScrollArea } from "@/ui/primitives/ScrollArea";

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
  const paddingClasses = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };

  if (scrollable) {
    return (
      <ScrollArea
        className={`flex-1 ${paddingClasses[padding]} ${className || ""}`}
      >
        {children}
      </ScrollArea>
    );
  }

  return (
    <div className={`${paddingClasses[padding]} ${className || ""}`}>
      {children}
    </div>
  );
}
