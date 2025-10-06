"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/ui/primitives/Button";

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
    <div className={`relative ${className || ""}`}>
      {/* Panel Container */}
      <div
        className={`relative transition-all duration-300 ease-in-out ${
          isCollapsed ? "h-12" : "h-full"
        }`}
      >
        {/* Main Content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {children}
        </div>

        {/* Collapsed Content */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {collapsedContent}
        </div>

        {/* Toggle Button - Inside Panel Header */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={`absolute top-2 right-2 transition-all duration-300 ease-in-out h-8 w-8`}
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
