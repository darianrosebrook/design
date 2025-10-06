"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { KeyboardShortcutsModal } from "@/ui/composers/KeyboardShortcutsModal";
import { Button } from "@/ui/primitives/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/primitives/DropdownMenu";

export function TopNavigation() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const menuItems = [
    {
      label: "File",
      items: [
        { label: "New", shortcut: "⌘N" },
        { label: "Open...", shortcut: "⌘O" },
        { label: "Save", shortcut: "⌘S" },
        { label: "Save As...", shortcut: "⌘⇧S" },
        { separator: true },
        { label: "Export...", shortcut: "⌘E" },
        { separator: true },
        { label: "Close", shortcut: "⌘W" },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", shortcut: "⌘Z" },
        { label: "Redo", shortcut: "⌘⇧Z" },
        { separator: true },
        { label: "Cut", shortcut: "⌘X" },
        { label: "Copy", shortcut: "⌘C" },
        { label: "Paste", shortcut: "⌘V" },
        { label: "Duplicate", shortcut: "⌘D" },
        { separator: true },
        { label: "Select All", shortcut: "⌘A" },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Zoom In", shortcut: "⌘+" },
        { label: "Zoom Out", shortcut: "⌘-" },
        { label: "Zoom to Fit", shortcut: "⌘0" },
        { label: "Zoom to Selection", shortcut: "⌘2" },
        { separator: true },
        { label: "Show Rulers", shortcut: "⌘R" },
        { label: "Show Grid", shortcut: "⌘'" },
        { label: "Show Guides", shortcut: "⌘;" },
      ],
    },
    {
      label: "Object",
      items: [
        { label: "Group Selection", shortcut: "⌘G" },
        { label: "Ungroup Selection", shortcut: "⌘⇧G" },
        { label: "Frame Selection", shortcut: "⌘⌥G" },
        { separator: true },
        { label: "Bring to Front", shortcut: "⌘]" },
        { label: "Send to Back", shortcut: "⌘[" },
        { label: "Bring Forward", shortcut: "⌘⌥]" },
        { label: "Send Backward", shortcut: "⌘⌥[" },
      ],
    },
    {
      label: "Window",
      items: [
        { label: "Minimize", shortcut: "⌘M" },
        { label: "Zoom" },
        { separator: true },
        { label: "Layers", shortcut: "⌘⌥1" },
        { label: "Properties", shortcut: "⌘⌥2" },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Documentation" },
        {
          label: "Keyboard Shortcuts",
          shortcut: "⌘/",
          action: "show-shortcuts",
        },
        { separator: true },
        { label: "About" },
      ],
    },
  ];

  return (
    <div className="flex h-12 items-center gap-1 border-b border-border bg-card px-3">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          DS
        </div>
        <span className="text-sm font-medium">Design System</span>
      </div>

      <div className="flex items-center gap-0.5">
        {menuItems.map((menu) => (
          <DropdownMenu key={menu.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm font-normal hover:bg-accent"
              >
                {menu.label}
                <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {menu.items.map((item, index) =>
                item.separator ? (
                  <DropdownMenuSeparator key={`separator-${index}`} />
                ) : (
                  <DropdownMenuItem
                    key={item.label}
                    className="flex items-center justify-between"
                    onClick={() => {
                      if (item.action === "show-shortcuts") {
                        setShowKeyboardShortcuts(true);
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-xs text-muted-foreground">
                        {item.shortcut}
                      </span>
                    )}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 px-3 text-sm">
          Share
        </Button>
      </div>

      <KeyboardShortcutsModal
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      />
    </div>
  );
}
