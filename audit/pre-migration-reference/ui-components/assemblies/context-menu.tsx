"use client";

import { useEffect } from "react";
import { useCanvas } from "@/lib/canvas-context";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Group,
  Frame,
  Type as TypeIcon,
} from "@/lib/components/icons";

export function ContextMenu() {
  const {
    contextMenu,
    setContextMenu,
    objects,
    duplicateObject,
    deleteObject,
    updateObject,
    bringForward,
    sendBackward,
  } = useCanvas();

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleScroll = () => setContextMenu(null);

    if (contextMenu) {
      document.addEventListener("click", handleClick);
      document.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("click", handleClick);
        document.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) {
    return null;
  }

  // Find the target object based on context menu type and target ID
  const findTargetObject = () => {
    if (!contextMenu) {
      return null;
    }

    if (contextMenu.type === "layers" && contextMenu.layerId) {
      // Find in objects array (root level or nested)
      return (
        objects.find((obj) => obj.id === contextMenu.layerId) ||
        objects
          .flatMap((obj) => obj.children || [])
          .find((obj) => obj.id === contextMenu.layerId)
      );
    } else if (contextMenu.type === "canvas" && contextMenu.objectId) {
      // Find in objects array (root level or nested)
      return (
        objects.find((obj) => obj.id === contextMenu.objectId) ||
        objects
          .flatMap((obj) => obj.children || [])
          .find((obj) => obj.id === contextMenu.objectId)
      );
    }

    return null;
  };

  const targetObject = findTargetObject();

  const getContextMenuItems = (): Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    shortcut?: string;
    danger?: boolean;
    onClick: () => void;
    disabled?: boolean;
  }> => {
    const baseItems = [
      {
        icon: Copy,
        label: "Duplicate",
        shortcut: "⌘D",
        onClick: () => {
          const targetId = contextMenu?.objectId || contextMenu?.layerId;
          if (targetId) {
            duplicateObject(targetId);
          }
          setContextMenu(null);
        },
      },
      {
        icon: Trash2,
        label: "Delete",
        shortcut: "⌫",
        danger: true,
        onClick: () => {
          const targetId = contextMenu?.objectId || contextMenu?.layerId;
          if (targetId) {
            deleteObject(targetId);
          }
          setContextMenu(null);
        },
      },
      { type: "separator" },
      {
        icon: targetObject?.locked ? Unlock : Lock,
        label: targetObject?.locked ? "Unlock" : "Lock",
        shortcut: "⌘L",
        onClick: () => {
          const targetId = contextMenu?.objectId || contextMenu?.layerId;
          if (targetId && targetObject) {
            updateObject(targetId, { locked: !targetObject.locked });
          }
          setContextMenu(null);
        },
      },
      {
        icon: targetObject?.visible === false ? Eye : EyeOff,
        label: targetObject?.visible === false ? "Show" : "Hide",
        shortcut: "⌘H",
        onClick: () => {
          const targetId = contextMenu?.objectId || contextMenu?.layerId;
          if (targetId && targetObject) {
            updateObject(targetId, { visible: !targetObject.visible });
          }
          setContextMenu(null);
        },
      },
      { type: "separator" },
      {
        icon: MoveUp,
        label: "Bring Forward",
        shortcut: "⌘]",
        onClick: () => {
          const targetId = contextMenu?.objectId || contextMenu?.layerId;
          if (targetId) {
            bringForward(targetId);
          }
          setContextMenu(null);
        },
      },
      {
        icon: MoveDown,
        label: "Send Backward",
        shortcut: "⌘[",
        onClick: () => {
          const targetId = contextMenu?.objectId || contextMenu?.layerId;
          if (targetId) {
            sendBackward(targetId);
          }
          setContextMenu(null);
        },
      },
      { type: "separator" },
      {
        icon: Group,
        label: "Group Selection",
        shortcut: "⌘G",
        onClick: () => {
          console.warn("Group selection not yet implemented");
          setContextMenu(null);
        },
      },
    ];

    // Add object-specific items based on type
    if (targetObject) {
      if (targetObject.type === "frame" || targetObject.type === "group") {
        baseItems.splice(-2, 0, {
          icon: Frame,
          label: "Auto Layout",
          onClick: () => {
            console.warn("Auto layout not yet implemented");
            setContextMenu(null);
          },
        });
      }

      if (targetObject.type === "text") {
        baseItems.splice(-2, 0, {
          icon: TypeIcon,
          label: "Edit Text",
          onClick: () => {
            console.warn("Edit text not yet implemented");
            setContextMenu(null);
          },
        });
      }
    }

    return baseItems;
  };

  const menuItems = getContextMenuItems();

  return (
    <div
      className="fixed z-50 min-w-[200px] bg-card border border-border rounded-xl shadow-2xl py-1"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.type === "separator") {
          return <div key={index} className="h-px bg-border my-1" />;
        }

        const Icon = item.icon;
        return (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors ${
              item.danger ? "text-red-500 hover:text-red-600" : ""
            } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={item.onClick}
            disabled={item.disabled}
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
