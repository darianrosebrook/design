"use client";

import { useState, useCallback } from "react";
import { useCanvas } from "@/lib/canvas-context";

export function useLayerDragDrop() {
  const { reorderLayers } = useCanvas();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        setDropIndex(index);
      }
    },
    [draggedIndex]
  );

  const handleDragEnd = useCallback(() => {
    if (
      draggedIndex !== null &&
      dropIndex !== null &&
      draggedIndex !== dropIndex
    ) {
      reorderLayers(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDropIndex(null);
  }, [draggedIndex, dropIndex, reorderLayers]);

  return {
    draggedIndex,
    dropIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
