"use client";

import {
  ChevronRight,
  Folder,
  Search,
  Grid,
  List,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type React from "react";

interface LibraryItem {
  id: string;
  name: string;
  type: "component" | "snippet" | "page";
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tags: string[];
  usage: number;
  lastUsed: string;
}

interface LibrarySectionProps {
  title: string;
  items: LibraryItem[];
  onInsert?: (item: LibraryItem) => void;
  onOpenDesignSystem?: () => void;
}

const _mockDesignSystemItems = {
  inFolder: [
    {
      id: "button-primary",
      name: "Primary Button",
      type: "component",
      icon: () => <div className="w-4 h-4 bg-blue-500 rounded" />,
      description: "Main call-to-action button",
      tags: ["button", "primary", "cta"],
      usage: 12,
      lastUsed: "2 hours ago",
    },
    {
      id: "card-product",
      name: "Product Card",
      type: "component",
      icon: () => <div className="w-4 h-4 bg-gray-300 rounded" />,
      description: "Product display card with image and details",
      tags: ["card", "product", "ecommerce"],
      usage: 8,
      lastUsed: "1 day ago",
    },
  ],
  repoLevel: [
    {
      id: "design-system-colors",
      name: "Color Palette",
      type: "snippet",
      icon: () => <div className="w-4 h-4 bg-purple-500 rounded-full" />,
      description: "Complete color system with tokens",
      tags: ["colors", "tokens", "system"],
      usage: 45,
      lastUsed: "30 minutes ago",
    },
    {
      id: "typography-scale",
      name: "Typography Scale",
      type: "snippet",
      icon: () => <div className="w-4 h-4 bg-green-500 rounded-full" />,
      description: "Font sizes, weights, and line heights",
      tags: ["typography", "fonts", "scale"],
      usage: 32,
      lastUsed: "1 hour ago",
    },
  ],
};

export function LibrarySection({
  title: _title,
  items: initialItems,
  onInsert,
  onOpenDesignSystem,
}: LibrarySectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["in-folder", "repo-level"])
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return initialItems;
    }

    return initialItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [searchQuery, initialItems]);

  const renderLibraryItem = (item: LibraryItem) => {
    const Icon = item.icon;
    return (
      <div
        key={item.id}
        className="group p-3 rounded-lg border border-border hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-muted">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{item.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {item.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{item.usage} uses</span>
              <span>•</span>
              <span>{item.lastUsed}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100"
            onClick={() => onInsert?.(item)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderLibrarySection = (
    sectionTitle: string,
    sectionItems: LibraryItem[],
    folderKey: string
  ) => (
    <div className="space-y-3">
      <button
        className="flex items-center gap-2 w-full text-left hover:bg-accent rounded-lg px-2 py-1.5 transition-colors"
        onClick={() => {
          setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(folderKey)) {
              newSet.delete(folderKey);
            } else {
              newSet.add(folderKey);
            }
            return newSet;
          });
        }}
      >
        <ChevronRight
          className={`h-4 w-4 transition-transform ${
            expandedFolders.has(folderKey) ? "rotate-90" : ""
          }`}
        />
        <Folder className="h-4 w-4" />
        <span className="font-medium text-sm">{sectionTitle}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {sectionItems.length}
        </Badge>
      </button>

      {expandedFolders.has(folderKey) && (
        <div className="space-y-2 pl-6">
          {sectionItems.map(renderLibraryItem)}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search and controls */}
      <div className="p-3 space-y-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components, snippets, pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${viewMode === "list" ? "bg-accent" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${viewMode === "grid" ? "bg-accent" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => console.warn("Refresh library")}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs"
            onClick={onOpenDesignSystem}
          >
            <Plus className="h-3 w-3 mr-1" />
            Insert
          </Button>
        </div>
      </div>

      {/* Library content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {renderLibrarySection(
            "In-folder",
            filteredItems.filter(
              (item) => item.id.includes("button") || item.id.includes("card")
            ),
            "in-folder"
          )}
          {renderLibrarySection(
            "Repo-level",
            filteredItems.filter(
              (item) =>
                item.id.includes("design-system") ||
                item.id.includes("typography")
            ),
            "repo-level"
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
