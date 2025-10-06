"use client";

import {
  ChevronRight,
  Eye,
  Lock,
  EyeOff,
  Unlock,
  Square,
  Circle,
  Type,
  ImageIcon,
  Layers,
  Frame,
  Component,
} from "lucide-react";
import type { CanvasObject, ObjectType } from "@/lib/types";
import { Button } from "@/ui/primitives/Button";

const typeIcons: Record<ObjectType, any> = {
  rectangle: Square,
  circle: Circle,
  text: Type,
  image: ImageIcon,
  group: Layers,
  frame: Frame,
  component: Component,
};

interface LayerItemProps {
  layer: CanvasObject;
  depth?: number;
  isSelected?: boolean;
  isPrimarySelected?: boolean;
  isDragging?: boolean;
  showDropIndicator?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onToggleExpanded?: () => void;
  onToggleVisible?: () => void;
  onToggleLocked?: () => void;
}

export function LayerItem({
  layer,
  depth = 0,
  isSelected = false,
  isPrimarySelected = false,
  isDragging = false,
  showDropIndicator = false,
  onClick,
  onDragStart,
  onDragOver,
  onDragEnd,
  onContextMenu,
  onToggleExpanded,
  onToggleVisible,
  onToggleLocked,
}: LayerItemProps) {
  const Icon = typeIcons[layer.type];

  return (
    <div key={layer.id}>
      {showDropIndicator && <div className="// h-0.5 bg-blue-500 mx-2 mb-1" />}
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onContextMenu={onContextMenu}
        className={`// group flex items-center gap-1 px-2 py-1.5 hover:bg-accent rounded-lg cursor-pointer transition-transform ${
          isSelected ? "bg-accent" : ""
        } ${isDragging ? "opacity-50" : ""} ${
          isPrimarySelected ? "ring-1 ring-blue-500" : ""
        }`}
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
        }}
        onClick={onClick}
      >
        {layer.children && layer.children.length > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            className="// h-4 w-4 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded?.();
            }}
          >
            <ChevronRight
              className={`// h-3 w-3 transition-transform ${
                layer.expanded ? "rotate-90" : ""
              }`}
            />
          </Button>
        ) : (
          <div className="// w-4" />
        )}

        <div className="// h-4 w-4 flex items-center justify-center text-xs text-muted-foreground shrink-0">
          <Icon className="// h-3 w-3" />
        </div>

        <span className="// flex-1 text-sm truncate">{layer.name}</span>

        <div className="// flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="// h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisible?.();
            }}
          >
            {layer.visible ? (
              <Eye className="// h-3.5 w-3.5" />
            ) : (
              <EyeOff className="// h-3.5 w-3.5 opacity-30" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="// h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLocked?.();
            }}
          >
            {layer.locked ? (
              <Lock className="// h-3.5 w-3.5" />
            ) : (
              <Unlock className="// h-3.5 w-3.5 opacity-30" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
