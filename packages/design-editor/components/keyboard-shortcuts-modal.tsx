"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getShortcutsByCategory,
  formatShortcut,
  type KeyboardShortcut,
  type ShortcutCategory,
} from "@/lib/keyboard-shortcuts";

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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Keyboard Shortcuts
            <Badge variant="secondary" className="ml-2">
              {filteredShortcuts.length} shortcuts
            </Badge>
          </DialogTitle>
          <DialogDescription>
            A comprehensive list of keyboard shortcuts available in the design
            editor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
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
          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      className={categoryColors[category as ShortcutCategory]}
                    >
                      {categoryLabels[category as ShortcutCategory]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {shortcuts.length} shortcuts
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={`${shortcut.action}-${index}`}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {shortcut.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {shortcut.action}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                            {formatShortcut(shortcut)}
                          </kbd>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
