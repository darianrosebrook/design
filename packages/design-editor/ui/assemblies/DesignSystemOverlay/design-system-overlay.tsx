"use client";

import { FileText, X, Library, Clock, Star } from "lucide-react";
import { useState, useMemo } from "react";
import type React from "react";
// import styles from "./design-system-overlay.module.scss";
import { useCanvas } from "@/lib/canvas-context";
import { DesignSystemItem as DesignSystemItemComponent } from "@/lib/components/design-system-item";
import { DesignSystemSearch } from "@/lib/components/design-system-search";
import { Component, LayersIcon, Square } from "@/lib/components/icons";
import type { DesignSystemItem } from "@/lib/data/design-system-items";
import {
  getDesignSystemItems,
  updateDesignSystemItemPreferences,
  getDesignSystemStats,
} from "@/lib/data/design-system-items";
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
    "components" | "snippets" | "pages" | "icons" | "recent" | "favorites"
  >("components");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Get fresh data when component mounts or when user interactions occur
  const [designSystemItems, setDesignSystemItems] = useState(() =>
    getDesignSystemItems()
  );

  // Get stats for recently used and most used items
  const stats = getDesignSystemStats();

  // Refresh data when needed
  const refreshDesignSystemItems = () => {
    setDesignSystemItems(getDesignSystemItems());
  };

  const categories = useMemo(() => {
    const cats = new Set(designSystemItems.map((item) => item.category));
    return Array.from(cats).sort();
  }, [designSystemItems]);

  const handleInsertItem = (item: DesignSystemItem) => {
    // Track usage
    updateDesignSystemItemPreferences(item.id, { incrementUsage: true });

    // Convert design system item to canvas object
    const canvasObject = convertDesignSystemItemToCanvasObject(item, 300, 200);

    // Add to canvas
    addObject(canvasObject);

    // Call the onInsert callback if provided
    onInsert(item);

    console.log(`Inserted ${item.name} into canvas`);
  };

  const filteredItems = useMemo(() => {
    let items: DesignSystemItem[] = [];

    // Handle special tabs first
    if (activeTab === "recent") {
      items = stats.recentlyUsed;
    } else if (activeTab === "favorites") {
      items = designSystemItems.filter((item) => item.isFavorite);
    } else {
      // Regular tabs - apply all filters
      items = designSystemItems.filter((item) => {
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

        // Filter by favorites (only applies to regular tabs)
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
    }

    // Sort items (skip sorting for special tabs if they already have custom ordering)
    if (activeTab !== "recent") {
      items.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "usage":
            return b.usage - a.usage;
          case "lastUsed":
            return (
              new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
            );
          case "complexity":
            const complexityOrder = { simple: 0, medium: 1, complex: 2 };
            return (
              complexityOrder[a.complexity] - complexityOrder[b.complexity]
            );
          default:
            return 0;
        }
      });
    }

    return items;
  }, [
    activeTab,
    selectedCategory,
    showFavoritesOnly,
    searchQuery,
    sortBy,
    designSystemItems,
    stats,
  ]);

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
            <TabsList className="grid w-full grid-cols-6">
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
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                Favorites
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
                    item={item as any}
                    viewMode={viewMode}
                    onInsert={handleInsertItem as any}
                    onToggleFavorite={(id: string) => {
                      const item = designSystemItems.find(
                        (item) => item.id === id
                      );
                      if (item) {
                        updateDesignSystemItemPreferences(id, {
                          isFavorite: !item.isFavorite,
                        });
                        refreshDesignSystemItems();
                      }
                    }}
                    onToggleBookmark={(id: string) => {
                      const item = designSystemItems.find(
                        (item) => item.id === id
                      );
                      if (item) {
                        updateDesignSystemItemPreferences(id, {
                          isBookmarked: !item.isBookmarked,
                        });
                        refreshDesignSystemItems();
                      }
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
