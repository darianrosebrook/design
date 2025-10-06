"use client";

import {
  ChevronRight,
  Folder,
  Search,
  Grid,
  List,
  RefreshCw,
  Plus,
  Package,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import type React from "react";
// No styles import needed - using Tailwind classes
import { useCanvas } from "@/lib/canvas-context";
import { convertLibraryItemToCanvasObject } from "@/lib/utils/library-to-canvas";
import {
  getAvailableComponents,
  getComponentMetadata,
  addRegistryListener,
} from "@/lib/utils/dynamic-component-registry";
import type { DesignSystemItem } from "@/lib/data/design-system-items";
import { Badge } from "@/ui/primitives/Badge";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import { LibraryIngestionModal } from "@/ui/assemblies/LibraryIngestionModal";
import { cn } from "@/lib/utils";

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
      icon: () => (
        <div className="w-8 h-8 flex items-center justify-center">
          {metadata.icon}
        </div>
      ),
      description: metadata.description,
      tags: [metadata.category.toLowerCase(), componentType.toLowerCase()],
      usage: 25, // Mock usage data - fixed value to prevent hydration mismatch
      lastUsed: "2 hours ago", // Mock last used - fixed value to prevent hydration mismatch
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
  const [isIngestionModalOpen, setIsIngestionModalOpen] = useState(false);
  const [registryVersion, setRegistryVersion] = useState(0);

  // Listen for registry changes
  useEffect(() => {
    const unsubscribe = addRegistryListener(() => {
      setRegistryVersion((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  // REAL DATA: Using actual design system components
  const designSystemItems = getDesignSystemLibraryItems();

  const handleIngestionSuccess = useCallback(() => {
    // Refresh the component list by triggering a re-render
    // The components are dynamically added to the registry, so the library will update automatically
    console.log("Library ingestion completed successfully");
  }, []);

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
        x: 150, // Fixed position to prevent hydration mismatch
        y: 150, // Fixed position to prevent hydration mismatch
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

    console.log(`Inserted ${item.name} into canvas`);
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
  }, [searchQuery, initialItems, designSystemItems, registryVersion]);

  const renderLibraryItem = (item: LibraryItem) => {
    const Icon = item.icon;
    return (
      <div
        key={item.id}
        className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon />
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <span>{item.usage} uses</span>
              <span>•</span>
              <span>{item.lastUsed}</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
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
            className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
        className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors"
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
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{sectionTitle}</span>
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
      <div className="p-4 border-b border-border space-y-3">
        {/* First flexbox: Search (full width) + Insert button (content width) */}

        {/* Second flexbox: List/Grid toggle + justify-between + Refresh and Import buttons */}
        <div className="flex items-center justify-between">
          {/* List/Grid toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${viewMode === "list" ? "bg-accent" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${viewMode === "grid" ? "bg-accent" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          {/* Refresh and Import buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => console.warn("Refresh library")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setIsIngestionModalOpen(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components, snippets, pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-8 flex-shrink-0"
            onClick={onOpenDesignSystem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Insert
          </Button>
        </div>
      </div>

      {/* Library content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
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

      {/* Library Ingestion Modal */}
      <LibraryIngestionModal
        isOpen={isIngestionModalOpen}
        onClose={() => setIsIngestionModalOpen(false)}
        onSuccess={handleIngestionSuccess}
      />
    </div>
  );
}
