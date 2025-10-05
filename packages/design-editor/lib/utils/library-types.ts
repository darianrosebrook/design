import type React from "react";

export interface LibraryItem {
  id: string;
  name: string;
  type: "component" | "snippet" | "page";
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tags: string[];
  usage: number;
  lastUsed: string;
}
