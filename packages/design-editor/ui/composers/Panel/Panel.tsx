"use client";

import type React from "react";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={`bg-card border border-border rounded-lg shadow-sm h-full flex flex-col ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
}
