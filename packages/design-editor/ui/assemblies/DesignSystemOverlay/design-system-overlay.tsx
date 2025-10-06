"use client";

import { FileText, X, Library } from "lucide-react";
import { useState, useMemo } from "react";
import type React from "react";
// import styles from "./design-system-overlay.module.scss";
import { useCanvas } from "@/lib/canvas-context";
import { DesignSystemItem as DesignSystemItemComponent } from "@/lib/components/design-system-item";
import { DesignSystemSearch } from "@/lib/components/design-system-search";
import { Component, LayersIcon, Square } from "@/lib/components/icons";
import type { DesignSystemItem } from "@/lib/data/design-system-items";
import { mockDesignSystemItems } from "@/lib/data/design-system-items";
import { convertDesignSystemItemToCanvasObject } from "@/lib/utils/design-system-to-canvas";
import { Button } from "@/ui/primitives/Button";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import { Tabs, TabsList, TabsTrigger } from "@/ui/primitives/Tabs";

interface DesignSystemOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (item: DesignSystemItem) => void;
}

export function DesignSystemOverlay({
  isOpen,
  onClose,
  onInsert,
}: DesignSystemOverlayProps) {
  const { addObject } = useCanvas();
  const [activeTab, setActiveTab] = useState<
    "components" | "snippets" | "pages" | "icons"
  >("components");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoritedItems, setFavoritedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(
    new Set()
  );

  const categories = useMemo(() => {
    const cats = new Set(mockDesignSystemItems.map((item) => item.category));
    return Array.from(cats).sort();
  }, []);

  const handleInsertItem = (item: DesignSystemItem) => {
    // Convert design system item to canvas object
    const canvasObject = convertDesignSystemItemToCanvasObject(item, 300, 200);

    // Add to canvas
    addObject(canvasObject);

    // Call the onInsert callback if provided
    onInsert(item);

    console.log(`Inserted ${item.name} into canvas`);
  };

  const filteredItems = useMemo(() => {
    const items = mockDesignSystemItems.filter((item) => {
      // Filter by tab
      if (activeTab === "components" && item.type !== "component") {
        return false;
      }
      if (activeTab === "snippets" && item.type !== "snippet") {
        return false;
      }
      if (activeTab === "pages" && item.type !== "page") {
        return false;
      }
      if (activeTab === "icons" && item.type !== "icon") {
        return false;
      }

      // Filter by category
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      // Filter by favorites
      if (showFavoritesOnly && !item.isFavorite) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          item.author.toLowerCase().includes(query);
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });

    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "usage":
          return b.usage - a.usage;
        case "lastUsed":
          // Simple comparison - in real app, parse dates
          return a.lastUsed.localeCompare(b.lastUsed);
        case "complexity":
          const complexityOrder = { simple: 0, medium: 1, complex: 2 };
          return complexityOrder[a.complexity] - complexityOrder[b.complexity];
        default:
          return 0;
      }
    });

    return items;
  }, [activeTab, selectedCategory, showFavoritesOnly, searchQuery, sortBy]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Design System Library</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse and insert components, snippets, and templates
            </p>
            {/* MOCK DATA: This modal showcases placeholder design system content */}
            <p className="text-xs text-muted-foreground mt-2">
              Demo content - showing mock design system items
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="components"
                className="flex items-center gap-2"
              >
                <Component className="h-4 w-4" />
                Components
              </TabsTrigger>
              <TabsTrigger value="snippets" className="flex items-center gap-2">
                <LayersIcon className="h-4 w-4" />
                Snippets
              </TabsTrigger>
              <TabsTrigger value="pages" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pages
              </TabsTrigger>
              <TabsTrigger value="icons" className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Icons
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <DesignSystemSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showFavoritesOnly={showFavoritesOnly}
              onShowFavoritesChange={setShowFavoritesOnly}
            />

            {/* Items grid/list */}
            <ScrollArea className="flex-1">
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
                    : "space-y-2 p-4"
                }
              >
                {filteredItems.map((item) => (
                  <DesignSystemItemComponent
                    key={item.id}
                    item={
                      {
                        ...item,
                        isFavorite: favoritedItems.has(item.id),
                        isBookmarked: bookmarkedItems.has(item.id),
                      } as any
                    }
                    viewMode={viewMode}
                    onInsert={handleInsertItem as any}
                    onToggleFavorite={(id: string) => {
                      setFavoritedItems((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(id)) {
                          newSet.delete(id);
                        } else {
                          newSet.add(id);
                        }
                        return newSet;
                      });
                    }}
                    onToggleBookmark={(id: string) => {
                      setBookmarkedItems((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(id)) {
                          newSet.delete(id);
                        } else {
                          newSet.add(id);
                        }
                        return newSet;
                      });
                    }}
                  />
                ))}
              </div>
              {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Library className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No items found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
