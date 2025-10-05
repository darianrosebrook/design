"use client";

import { useCallback } from "react";
import { useCanvas } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";

export function useMultiSelection() {
  const {
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    addToSelection,
    removeFromSelection,
    clearSelection,
  } = useCanvas();

  const getAllObjectIds = useCallback((objects: CanvasObject[]): string[] => {
    const ids: string[] = [];
    const traverse = (objs: CanvasObject[]) => {
      objs.forEach((obj) => {
        ids.push(obj.id);
        if (obj.children && obj.children.length > 0 && obj.expanded) {
          traverse(obj.children);
        }
      });
    };
    traverse(objects);
    return ids;
  }, []);

  const handleLayerClick = useCallback(
    (e: React.MouseEvent, layerId: string, objects: CanvasObject[]) => {
      e.stopPropagation();

      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl click: toggle selection
        if (selectedIds.has(layerId)) {
          removeFromSelection(layerId);
        } else {
          addToSelection(layerId);
        }
      } else if (e.shiftKey && selectedId) {
        // Shift click: select range
        const allObjectIds = getAllObjectIds(objects);
        const currentIndex = allObjectIds.indexOf(selectedId);
        const targetIndex = allObjectIds.indexOf(layerId);

        if (currentIndex !== -1 && targetIndex !== -1) {
          const start = Math.min(currentIndex, targetIndex);
          const end = Math.max(currentIndex, targetIndex);
          const rangeIds = allObjectIds.slice(start, end + 1);
          setSelectedIds(new Set(rangeIds));
          setSelectedId(layerId);
        }
      } else {
        // Regular click: single selection
        clearSelection();
        setSelectedId(layerId);
      }
    },
    [
      selectedId,
      selectedIds,
      setSelectedId,
      setSelectedIds,
      addToSelection,
      removeFromSelection,
      clearSelection,
      getAllObjectIds,
    ]
  );

  return {
    selectedId,
    selectedIds,
    handleLayerClick,
    getAllObjectIds,
    clearSelection,
    addToSelection,
    removeFromSelection,
  };
}
