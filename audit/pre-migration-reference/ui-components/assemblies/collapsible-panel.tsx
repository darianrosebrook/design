"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <div
      className={`relative transition-all duration-300 ease-in-out ${className}`}
    >
      {/* Panel Container */}
      <div
        className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "h-12" : "h-full"
        }`}
      >
        {/* Main Content */}
        <div
          className={`transition-all duration-300 ${
            isCollapsed
              ? "opacity-0 scale-95 pointer-events-none"
              : "opacity-100 scale-100"
          }`}
        >
          {children}
        </div>

        {/* Collapsed Content */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isCollapsed
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {collapsedContent}
        </div>

        {/* Toggle Button - Inside Panel Header */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={`absolute top-2 right-2 h-6 w-6 hover:bg-accent transition-all duration-300 z-20 bg-card/80 border border-border shadow-sm rounded-full`}
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}
