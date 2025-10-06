"use client";

import { useEffect } from "react";
import { useCanvas } from "@/lib/canvas-context";
import {
  Copy,
  Trash2,
  Lock,
  Eye,
  MoveUp,
  MoveDown,
  Group,
  Ungroup,
  Edit,
  BringToFront,
  SendToBack,
  Paste,
  Scissors,
  Component,
  Frame,
  Layers,
  EyeOff,
  Unlock,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Context menu component for canvas interactions
 * Provides right-click functionality for objects and canvas areas
 *
 * @author @darianrosebrook
 */
export function ContextMenu() {
  const {
    contextMenu,
    setContextMenu,
    objects,
    setObjects,
    selectedId,
    duplicateObject,
    deleteObject,
    bringForward,
    sendBackward,
    updateObject,
  } = useCanvas();

  // Close context menu on outside clicks and scroll
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Only close if clicking outside the context menu
      const contextMenuElement = document.querySelector("[data-context-menu]");
      if (
        contextMenuElement &&
        !contextMenuElement.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };
    const handleScroll = () => setContextMenu(null);

    if (contextMenu) {
      // Add a small delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClick);
        document.addEventListener("scroll", handleScroll, true);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClick);
        document.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const selectedObject = selectedId
    ? objects.find((obj) => obj.id === selectedId) ||
      objects
        .flatMap((obj) => obj.children || [])
        .find((obj) => obj.id === selectedId)
    : null;

  const handleAction = (action: string) => {
    if (!selectedId) return;

    switch (action) {
      case "duplicate":
        duplicateObject(selectedId);
        break;
      case "delete":
        deleteObject(selectedId);
        break;
      case "lock":
        if (selectedObject) {
          updateObject(selectedId, { locked: !selectedObject.locked });
        }
        break;
      case "hide":
        if (selectedObject) {
          updateObject(selectedId, { visible: !selectedObject.visible });
        }
        break;
      case "bring-forward":
        bringForward(selectedId);
        break;
      case "send-backward":
        sendBackward(selectedId);
        break;
      case "bring-to-front":
        // Find the object and move it to the end of the objects array (top layer)
        const objectIndex = objects.findIndex((obj) => obj.id === selectedId);
        if (objectIndex !== -1) {
          const [object] = objects.splice(objectIndex, 1);
          setObjects([...objects, object]);
        }
        break;
      case "send-to-back":
        // Find the object and move it to the beginning of the objects array (bottom layer)
        const backObjectIndex = objects.findIndex(
          (obj) => obj.id === selectedId
        );
        if (backObjectIndex !== -1) {
          const [object] = objects.splice(backObjectIndex, 1);
          setObjects([object, ...objects]);
        }
        break;
      case "group":
        // TODO: Implement group functionality
        console.log("Group Selection - not implemented yet");
        break;
      case "ungroup":
        // TODO: Implement ungroup functionality
        console.log("Ungroup Selection - not implemented yet");
        break;
      default:
        console.log(`Unknown context menu action: ${action}`);
    }

    setContextMenu(null);
  };

  // Canvas context menu (no object selected)
  const canvasMenuItems = [
    {
      icon: Edit,
      label: "Paste",
      shortcut: "⌘V",
      action: "paste",
      disabled: true, // TODO: Implement paste functionality
    },
    { type: "separator" },
    {
      icon: Group,
      label: "Create Frame",
      shortcut: "⌘G",
      action: "create-frame",
      disabled: true, // TODO: Implement frame creation
    },
  ];

  // Object context menu (object selected)
  const objectMenuItems = [
    {
      icon: Copy,
      label: "Duplicate",
      shortcut: "⌘D",
      action: "duplicate",
    },
    {
      icon: Copy,
      label: "Copy",
      shortcut: "⌘C",
      action: "copy",
      disabled: true, // TODO: Implement copy functionality
    },
    { type: "separator" },
    {
      icon: Trash2,
      label: "Delete",
      shortcut: "⌫",
      danger: true,
      action: "delete",
    },
    { type: "separator" },
    {
      icon: selectedObject?.locked ? Lock : Lock,
      label: selectedObject?.locked ? "Unlock" : "Lock",
      shortcut: "⌘⇧L",
      action: "lock",
    },
    {
      icon: selectedObject?.visible ? Eye : Eye,
      label: selectedObject?.visible ? "Hide" : "Show",
      shortcut: "⌘⇧H",
      action: "hide",
    },
    { type: "separator" },
    {
      icon: BringToFront,
      label: "Bring to Front",
      shortcut: "⌘⇧]",
      action: "bring-to-front",
    },
    {
      icon: MoveUp,
      label: "Bring Forward",
      shortcut: "⌘]",
      action: "bring-forward",
    },
    {
      icon: MoveDown,
      label: "Send Backward",
      shortcut: "⌘[",
      action: "send-backward",
    },
    {
      icon: SendToBack,
      label: "Send to Back",
      shortcut: "⌘⇧[",
      action: "send-to-back",
    },
    { type: "separator" },
    {
      icon: Group,
      label: "Group Selection",
      shortcut: "⌘G",
      action: "group",
      disabled: true, // TODO: Implement group functionality
    },
    {
      icon: Ungroup,
      label: "Ungroup Selection",
      shortcut: "⌘⇧G",
      action: "ungroup",
      disabled: true, // TODO: Implement ungroup functionality
    },
  ];

  // Determine which menu to show based on context type and selection
  const getMenuItems = () => {
    // If we have a layerId or objectId, show object menu
    if (contextMenu.layerId || contextMenu.objectId) {
      return objectMenuItems;
    }

    // If context type is layers, show object menu
    if (contextMenu.type === "layers") {
      return objectMenuItems;
    }

    // Otherwise show canvas menu
    return canvasMenuItems;
  };

  const menuItems = getMenuItems();

  return (
    <div
      data-context-menu
      className="fixed z-[9999] min-w-[200px] bg-card border border-border rounded-xl shadow-2xl py-1"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        position: "fixed",
        zIndex: 9999,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.type === "separator") {
          return <div key={index} className="h-px bg-border my-1" />;
        }

        const Icon = item.icon!;
        const isDisabled = item.disabled;

        return (
          <button
            key={index}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors",
              item.danger && "text-red-500 hover:text-red-600",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !isDisabled && handleAction(item.action)}
            disabled={isDisabled}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-muted-foreground">
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
