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
import type React from "react";
import {
  getAvailableComponents,
  getComponentMetadata,
} from "./component-renderer";
import { useCanvas } from "@/lib/canvas-context";
import { convertLibraryItemToCanvasObject } from "@/lib/utils/library-to-canvas";
import { Badge } from "@/ui/primitives/Badge";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { ScrollArea } from "@/ui/primitives/ScrollArea";

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

// Convert design system components to library items
const getDesignSystemLibraryItems = (): LibraryItem[] => {
  const availableComponents = getAvailableComponents();

  return availableComponents.map((componentType) => {
    const metadata = getComponentMetadata(componentType);

    return {
      id: `ds-${componentType.toLowerCase()}`,
      name: metadata.name,
      type: "component" as const,
      icon: () => <div className="text-lg">{metadata.icon}</div>,
      description: metadata.description,
      tags: [metadata.category.toLowerCase(), componentType.toLowerCase()],
      usage: Math.floor(Math.random() * 50) + 1, // Mock usage data
      lastUsed: `${Math.floor(Math.random() * 24)} hours ago`, // Mock last used
    };
  });
};

export function LibrarySection({
  title: _title,
  items: initialItems,
  onInsert,
  onOpenDesignSystem,
}: LibrarySectionProps) {
  const { addObject } = useCanvas();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["in-folder", "repo-level"])
  );

  // REAL DATA: Using actual design system components
  const designSystemItems = getDesignSystemLibraryItems();

  const handleInsertItem = (item: LibraryItem) => {
    // Check if this is a design system component
    if (item.id.startsWith("ds-")) {
      const componentType = item.id.replace("ds-", "").toLowerCase();
      const capitalizedType =
        componentType.charAt(0).toUpperCase() + componentType.slice(1);
      const metadata = getComponentMetadata(capitalizedType as any);

      // Create component object directly
      const componentObject = {
        id: `component-${Date.now()}`,
        type: "component" as const,
        name: `${capitalizedType} Component`,
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: capitalizedType === "Button" ? 120 : 200,
        height: capitalizedType === "Button" ? 40 : 60,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 100,
        componentType: capitalizedType,
        componentProps: metadata.defaultProps,
      };

      // Add to canvas
      addObject(componentObject);
    } else {
      // Fallback to original conversion for non-design-system items
      const canvasObject = convertLibraryItemToCanvasObject(item, 200, 200);
      addObject(canvasObject);
    }

    // Call the onInsert callback if provided
    onInsert?.(item);

    console.info(`Inserted ${item.name} into canvas`);
  };

  const filteredItems = useMemo(() => {
    const itemsToFilter =
      initialItems.length > 0 ? initialItems : designSystemItems;

    if (!searchQuery) {
      return itemsToFilter;
    }

    return itemsToFilter.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [searchQuery, initialItems, designSystemItems]);

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
            onClick={() => handleInsertItem(item)}
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
          {/* Interactive Components */}
          {renderLibrarySection(
            "Interactive",
            filteredItems.filter((item) => item.tags.includes("interactive")),
            "interactive"
          )}
          {/* Layout Components */}
          {renderLibrarySection(
            "Layout",
            filteredItems.filter((item) => item.tags.includes("layout")),
            "layout"
          )}
          {/* Form Components */}
          {renderLibrarySection(
            "Form",
            filteredItems.filter((item) => item.tags.includes("form")),
            "form"
          )}
          {/* Typography Components */}
          {renderLibrarySection(
            "Typography",
            filteredItems.filter((item) => item.tags.includes("typography")),
            "typography"
          )}
          {/* Media Components */}
          {renderLibrarySection(
            "Media",
            filteredItems.filter((item) => item.tags.includes("media")),
            "media"
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
