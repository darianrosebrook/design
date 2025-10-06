"use client"
import {
  ChevronRight,
  Eye,
  Lock,
  MoreHorizontal,
  Square,
  Circle,
  Type,
  ImageIcon,
  LayersIcon,
  Frame,
} from "lucide-react"
import { useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCanvas } from "@/lib/canvas-context"
import type { CanvasObject, ObjectType } from "@/lib/types"

const typeIcons: Record<ObjectType, any> = {
  rectangle: Square,
  circle: Circle,
  text: Type,
  image: ImageIcon,
  group: LayersIcon,
  frame: Frame,
}

export function LayersPanel() {
  const { objects, selectedId, setSelectedId, updateObject, reorderLayers } = useCanvas()

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const toggleExpanded = (id: string) => {
    const obj = objects.find((o) => o.id === id)
    if (obj) {
      updateObject(id, { expanded: !obj.expanded })
    }
  }

  const toggleVisible = (id: string, obj: CanvasObject) => {
    updateObject(id, { visible: !obj.visible })
  }

  const toggleLocked = (id: string, obj: CanvasObject) => {
    updateObject(id, { locked: !obj.locked })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dropIndex !== null && draggedIndex !== dropIndex) {
      reorderLayers(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
    setDropIndex(null)
  }

  const renderLayer = (layer: CanvasObject, depth = 0, index: number) => {
    if (!layer) {return null}

    const Icon = typeIcons[layer.type]
    const isSelected = layer.id === selectedId
    const isDragging = draggedIndex === index
    const showDropIndicator = dropIndex === index

    return (
      <div key={layer.id}>
        {showDropIndicator && draggedIndex !== index && <div className="h-0.5 bg-blue-500 mx-2 mb-1" />}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`group flex items-center gap-1 px-2 py-1.5 hover:bg-accent rounded-lg cursor-pointer transition-transform ${
            isSelected ? "bg-accent" : ""
          } ${isDragging ? "opacity-50" : ""}`}
          style={{
            paddingLeft: `${depth * 16 + 8}px`,
            transform:
              showDropIndicator && draggedIndex !== null && draggedIndex < index
                ? "translateY(4px)"
                : showDropIndicator && draggedIndex !== null && draggedIndex > index
                  ? "translateY(-4px)"
                  : "none",
          }}
          onClick={() => setSelectedId(layer.id)}
        >
          {layer.children && layer.children.length > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(layer.id)
              }}
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${layer.expanded ? "rotate-90" : ""}`} />
            </Button>
          ) : (
            <div className="w-4" />
          )}

          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

          <span className="flex-1 text-sm truncate">{layer.name}</span>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleVisible(layer.id, layer)
              }}
            >
              <Eye className={`h-3.5 w-3.5 ${!layer.visible ? "opacity-30" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleLocked(layer.id, layer)
              }}
            >
              <Lock className={`h-3.5 w-3.5 ${!layer.locked ? "opacity-30" : ""}`} />
            </Button>
          </div>
        </div>
        {layer.expanded && layer.children && layer.children.length > 0 && (
          <>
            {layer.children
              .map((childId) => objects.find((obj) => obj.id === childId))
              .filter((child): child is CanvasObject => child !== undefined)
              .map((child, childIndex) => renderLayer(child, depth + 1, childIndex))}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Layers</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {objects
            .filter((layer): layer is CanvasObject => layer !== undefined)
            .map((layer, index) => renderLayer(layer, 0, index))}
        </div>
      </ScrollArea>
    </div>
  )
}
