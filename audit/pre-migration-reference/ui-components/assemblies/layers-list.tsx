"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { LayerItem } from "@/components/layer-item";
import { useMultiSelection } from "@/lib/hooks/use-multi-selection";
import { useLayerDragDrop } from "@/lib/hooks/use-layer-drag-drop";
import { useCanvas } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";

interface LayersListProps {
  objects: CanvasObject[];
}

export function LayersList({ objects }: LayersListProps) {
  const { updateObject, setContextMenu } = useCanvas();
  const { handleLayerClick, selectedIds } = useMultiSelection();
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

  const handleContextMenu = (e: React.MouseEvent, layerId?: string) => {
    e.preventDefault();
    e.stopPropagation();
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
    const isPrimarySelected =
      objects.findIndex((obj) => obj.id === layer.id) === index;

    return (
      <LayerItem
        key={layer.id}
        layer={layer}
        depth={depth}
        isSelected={isSelected}
        isPrimarySelected={isPrimarySelected}
        isDragging={draggedIndex === index}
        showDropIndicator={dropIndex === index}
        onClick={(e) => handleLayerClick(e, layer.id, objects)}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        onContextMenu={(e) => handleContextMenu(e, layer.id)}
        onToggleExpanded={() => toggleExpanded(layer.id)}
        onToggleVisible={() => toggleVisible(layer.id, layer)}
        onToggleLocked={() => toggleLocked(layer.id, layer)}
      />
    );
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-0.5">
        {objects
          .filter((layer): layer is CanvasObject => layer !== undefined)
          .map((layer, index) => renderLayer(layer, 0, index))}
      </div>
    </ScrollArea>
  );
}
