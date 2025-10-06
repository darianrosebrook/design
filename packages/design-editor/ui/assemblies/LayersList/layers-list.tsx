"use client";

import {
  MoreHorizontal,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCanvas } from "@/lib/canvas-context";
import { useLayerDragDrop } from "@/lib/hooks/use-layer-drag-drop";
import { useMultiSelection } from "@/lib/hooks/use-multi-selection";
import type { CanvasObject } from "@/lib/types";
import { LayerItem } from "@/ui/assemblies/LayerItem";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import { Button } from "@/ui/primitives/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/primitives/DropdownMenu";

interface LayersListProps {
  objects: CanvasObject[];
}

export function LayersList({ objects }: LayersListProps) {
  const { updateObject, setContextMenu, setSelectedId } = useCanvas();
  const { handleLayerClick, selectedIds, selectedId } = useMultiSelection();
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    draggedIndex,
    dropIndex,
  } = useLayerDragDrop();

  const toggleExpanded = (id: string) => {
    const obj = objects.find((o) => o.id === id);
    if (obj) {
      updateObject(id, { expanded: !obj.expanded });
    }
  };

  const toggleVisible = (id: string, obj: CanvasObject) => {
    updateObject(id, { visible: !obj.visible });
  };

  const toggleLocked = (id: string, obj: CanvasObject) => {
    updateObject(id, { locked: !obj.locked });
  };

  // Layer management functions
  const expandAll = () => {
    objects.forEach((obj) => {
      if (obj.children && obj.children.length > 0 && !obj.expanded) {
        updateObject(obj.id, { expanded: true });
      }
    });
  };

  const collapseAll = () => {
    objects.forEach((obj) => {
      if (obj.expanded) {
        updateObject(obj.id, { expanded: false });
      }
    });
  };

  const showAll = () => {
    objects.forEach((obj) => {
      if (!obj.visible) {
        updateObject(obj.id, { visible: true });
      }
    });
  };

  const hideAll = () => {
    objects.forEach((obj) => {
      if (obj.visible) {
        updateObject(obj.id, { visible: false });
      }
    });
  };

  const lockAll = () => {
    objects.forEach((obj) => {
      if (!obj.locked) {
        updateObject(obj.id, { locked: true });
      }
    });
  };

  const unlockAll = () => {
    objects.forEach((obj) => {
      if (obj.locked) {
        updateObject(obj.id, { locked: false });
      }
    });
  };

  const handleContextMenu = (e: React.MouseEvent, layerId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Select the layer if it's not already selected
    if (layerId && selectedId !== layerId) {
      setSelectedId(layerId);
    }

    setContextMenu({
      type: "layers",
      x: e.clientX,
      y: e.clientY,
      layerId,
    });
  };

  const renderLayer = (layer: CanvasObject, depth = 0, index: number) => {
    if (!layer) {
      return null;
    }

    const isSelected = selectedIds.has(layer.id);
    const isPrimarySelected = layer.id === selectedId;

    return (
      <div key={layer.id}>
        <LayerItem
          layer={layer}
          depth={depth}
          index={index}
          isSelected={isSelected}
          isPrimarySelected={isPrimarySelected}
          isDragging={draggedIndex === index}
          showDropIndicator={dropIndex === index}
          draggedIndex={draggedIndex}
          onClick={(e) => handleLayerClick(e, layer.id, objects)}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onContextMenu={(e) => handleContextMenu(e, layer.id)}
          onToggleExpanded={() => toggleExpanded(layer.id)}
          onToggleVisible={() => toggleVisible(layer.id, layer)}
          onToggleLocked={() => toggleLocked(layer.id, layer)}
        />
        {/* Render children if expanded */}
        {layer.children && layer.children.length > 0 && layer.expanded && (
          <div>
            {layer.children.map(
              (child, childIndex) =>
                renderLayer(child, depth + 1, index + childIndex + 1) // Simple offset for children
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Layers</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={expandAll}>
              <ChevronDown className="h-4 w-4" />
              Expand All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={collapseAll}>
              <ChevronUp className="h-4 w-4" />
              Collapse All
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={showAll}>
              <Eye className="h-4 w-4" />
              Show All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={hideAll}>
              <EyeOff className="h-4 w-4" />
              Hide All
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={lockAll}>
              <Lock className="h-4 w-4" />
              Lock All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={unlockAll}>
              <Unlock className="h-4 w-4" />
              Unlock All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {objects
            .filter((layer): layer is CanvasObject => layer !== undefined)
            .map((layer, index) => renderLayer(layer, 0, index))}
        </div>
      </ScrollArea>
    </div>
  );
}
