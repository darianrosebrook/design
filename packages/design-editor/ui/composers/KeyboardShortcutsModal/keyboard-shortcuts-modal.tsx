"use client";

import type React from "react";
import { useState, useEffect } from "react";
import styles from "./keyboard-shortcuts-modal.module.scss";
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
      <DialogContent className={styles.shortcutsModal}>
        <DialogHeader>
          <DialogTitle className={styles.shortcutsTitle}>
            Keyboard Shortcuts
            <Badge variant="secondary" className={styles.badge}>
              {filteredShortcuts.filter((s) => s.implemented !== false).length}/
              {filteredShortcuts.length} implemented
            </Badge>
          </DialogTitle>
          <DialogDescription>
            A comprehensive list of keyboard shortcuts available in the design
            editor.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.shortcutsContent}>
          {/* Search */}
          <div className={styles.searchContainer}>
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <div className={styles.searchIconContainer}>
              <svg
                className={styles.searchIcon}
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
          <ScrollArea className={styles.shortcutsScrollArea}>
            <div className={styles.shortcutsGrid}>
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <div className={styles.categoryHeader}>
                    <Badge
                      className={categoryColors[category as ShortcutCategory]}
                    >
                      {categoryLabels[category as ShortcutCategory]}
                    </Badge>
                    <span className={styles.categoryCount}>
                      {shortcuts.filter((s) => s.implemented !== false).length}/
                      {shortcuts.length} implemented
                    </span>
                  </div>

                  <div className={styles.shortcutsList}>
                    {shortcuts.map((shortcut, index) => {
                      const isImplemented = shortcut.implemented !== false; // Default to true if not specified
                      return (
                        <div
                          key={`${shortcut.action}-${index}`}
                          className={`${styles.shortcutItem} ${
                            isImplemented
                              ? styles["shortcutItem--implemented"]
                              : styles["shortcutItem--notImplemented"]
                          }`}
                        >
                          <div className={styles.shortcutContent}>
                            <div
                              className={`${styles.shortcutName} ${
                                !isImplemented
                                  ? styles["shortcutName--notImplemented"]
                                  : ""
                              }`}
                            >
                              {shortcut.description}
                              {!isImplemented && (
                                <span className={styles.comingSoonBadge}>
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <div className={styles.shortcutDescription}>
                              {shortcut.action}
                            </div>
                          </div>
                          <div className={styles.shortcutKeys}>
                            <kbd
                              className={`${styles.shortcutKey} ${
                                isImplemented
                                  ? styles["shortcutKey--implemented"]
                                  : styles["shortcutKey--notImplemented"]
                              }`}
                            >
                              {formatShortcut(shortcut)}
                            </kbd>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className={styles.categorySeparator} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
