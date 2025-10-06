"use client";

import type React from "react";
import { useState, useEffect } from "react";
// Removed SCSS module import - using Tailwind classes
import {
  getShortcutsByCategory,
  formatShortcut,
  type KeyboardShortcut,
  type ShortcutCategory,
} from "@/lib/keyboard-shortcuts";
import { Badge } from "@/ui/primitives/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/Dialog";
import { Input } from "@/ui/primitives/Input";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import { Separator } from "@/ui/primitives/Separator";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredShortcuts, setFilteredShortcuts] = useState<
    KeyboardShortcut[]
  >([]);

  // Update filtered shortcuts when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Group shortcuts by category
      const categories: ShortcutCategory[] = [
        "essential",
        "tools",
        "view",
        "zoom",
        "text",
        "shape",
        "selection",
        "edit",
        "transform",
        "arrange",
        "components",
      ];

      const allShortcuts: KeyboardShortcut[] = [];
      categories.forEach((category) => {
        allShortcuts.push(...getShortcutsByCategory(category));
      });

      setFilteredShortcuts(allShortcuts);
    } else {
      // Filter shortcuts by search query
      const allShortcuts: KeyboardShortcut[] = [];
      const categories: ShortcutCategory[] = [
        "essential",
        "tools",
        "view",
        "zoom",
        "text",
        "shape",
        "selection",
        "edit",
        "transform",
        "arrange",
        "components",
      ];

      categories.forEach((category) => {
        allShortcuts.push(...getShortcutsByCategory(category));
      });

      const filtered = allShortcuts.filter(
        (shortcut) =>
          shortcut.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          shortcut.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formatShortcut(shortcut)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );

      setFilteredShortcuts(filtered);
    }
  }, [searchQuery]);

  // Group filtered shortcuts by category
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<ShortcutCategory, KeyboardShortcut[]>);

  const categoryLabels: Record<ShortcutCategory, string> = {
    essential: "Essential",
    tools: "Tools",
    view: "View",
    zoom: "Zoom",
    text: "Text",
    shape: "Shape",
    selection: "Selection",
    edit: "Edit",
    transform: "Transform",
    arrange: "Arrange",
    components: "Components",
    cursor: "Cursor",
  };

  const categoryColors: Record<ShortcutCategory, string> = {
    essential: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    tools: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    view: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    zoom: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    text: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    shape:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    selection:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    edit: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    transform: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    arrange: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    components:
      "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
    cursor: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            Keyboard Shortcuts
            <Badge variant="secondary" className="text-xs">
              {filteredShortcuts.filter((s) => s.implemented !== false).length}/
              {filteredShortcuts.length} implemented
            </Badge>
          </DialogTitle>
          <DialogDescription>
            A comprehensive list of keyboard shortcuts available in the design
            editor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Shortcuts List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      className={categoryColors[category as ShortcutCategory]}
                    >
                      {categoryLabels[category as ShortcutCategory]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {shortcuts.filter((s) => s.implemented !== false).length}/
                      {shortcuts.length} implemented
                    </span>
                  </div>

                  <div className="space-y-2">
                    {shortcuts.map((shortcut, index) => {
                      const isImplemented = shortcut.implemented !== false; // Default to true if not specified
                      return (
                        <div
                          key={`${shortcut.action}-${index}`}
                          className={`flex items-center justify-between p-2 rounded border ${
                            isImplemented
                              ? "bg-background border-border"
                              : "bg-muted/50 border-border/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className={`text-sm font-medium ${
                                !isImplemented
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {shortcut.description}
                              {!isImplemented && (
                                <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {shortcut.action}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <kbd
                              className={`px-2 py-1 text-xs font-mono rounded border ${
                                isImplemented
                                  ? "bg-muted text-foreground border-border"
                                  : "bg-muted/50 text-muted-foreground border-border/50"
                              }`}
                            >
                              {formatShortcut(shortcut)}
                            </kbd>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
