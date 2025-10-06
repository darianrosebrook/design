"use client";

import { useState, useMemo } from "react";
import type React from "react";
import { FileText, X, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Component, LayersIcon, Square } from "@/lib/components/icons";
import { DesignSystemSearch } from "@/lib/components/design-system-search";
import { DesignSystemItem } from "@/lib/components/design-system-item";
import { mockDesignSystemItems } from "@/lib/data/design-system-items";

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
  const [activeTab, setActiveTab] = useState<
    "components" | "snippets" | "pages" | "icons"
  >("components");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(mockDesignSystemItems.map((item) => item.category));
    return Array.from(cats).sort();
  }, []);

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
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Design System Library</h2>
            <p className="text-sm text-muted-foreground">
              Browse and insert components, snippets, and templates
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="px-6 py-4 border-b border-border">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="components">
                <Component className="h-4 w-4 mr-2" />
                Components
              </TabsTrigger>
              <TabsTrigger value="snippets">
                <LayersIcon className="h-4 w-4 mr-2" />
                Snippets
              </TabsTrigger>
              <TabsTrigger value="pages">
                <FileText className="h-4 w-4 mr-2" />
                Pages
              </TabsTrigger>
              <TabsTrigger value="icons">
                <Square className="h-4 w-4 mr-2" />
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
                className={`p-6 ${
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-4"
                }`}
              >
                {filteredItems.map((item) => (
                  <DesignSystemItem
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    onInsert={onInsert}
                    onToggleFavorite={() => {
                      // TODO: Implement toggle favorite
                      console.warn("Toggle favorite:", item.id);
                    }}
                    onToggleBookmark={() => {
                      // TODO: Implement toggle bookmark
                      console.warn("Toggle bookmark:", item.id);
                    }}
                  />
                ))}
              </div>
              {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Library className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No items found</h3>
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
