"use client"

import type React from "react"

import { useState } from "react"
import { ChevronRight, Link2, Unlink, Plus, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCanvas } from "@/lib/canvas-context"
import type { CanvasObject } from "@/lib/types"

interface PropertySection {
  id: string
  title: string
  expanded: boolean
}

export function PropertiesPanel() {
  const { objects, selectedId, updateObject } = useCanvas()
  const [sections, setSections] = useState<PropertySection[]>([
    { id: "position", title: "Position", expanded: true },
    { id: "layout", title: "Layout", expanded: true },
    { id: "appearance", title: "Appearance", expanded: true },
    { id: "typography", title: "Typography", expanded: false },
    { id: "fill", title: "Fill", expanded: false },
    { id: "stroke", title: "Stroke", expanded: false },
    { id: "effects", title: "Effects", expanded: false },
    { id: "export", title: "Export", expanded: false },
  ])

  const [aspectLocked, setAspectLocked] = useState(true)
  const [cornerLocked, setCornerLocked] = useState(true)

  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null)
  const [dropSectionIndex, setDropSectionIndex] = useState<number | null>(null)

  const findObject = (objs: CanvasObject[], id: string): CanvasObject | null => {
    for (const obj of objs) {
      if (obj.id === id) return obj
      if (obj.children) {
        const found = findObject(obj.children, id)
        if (found) return found
      }
    }
    return null
  }

  const selectedObject = selectedId ? findObject(objects, selectedId) : null

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, expanded: !section.expanded } : section)),
    )
  }

  const handleSectionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedSectionIndex !== null && draggedSectionIndex !== index) {
      setDropSectionIndex(index)
    }
  }

  const handleSectionDragEnd = () => {
    if (draggedSectionIndex !== null && dropSectionIndex !== null && draggedSectionIndex !== dropSectionIndex) {
      const newSections = [...sections]
      const [removed] = newSections.splice(draggedSectionIndex, 1)
      newSections.splice(dropSectionIndex, 0, removed)
      setSections(newSections)
    }
    setDraggedSectionIndex(null)
    setDropSectionIndex(null)
  }

  const shouldShowSection = (sectionId: string): boolean => {
    if (!selectedObject) return false

    switch (sectionId) {
      case "typography":
        return selectedObject.type === "text"
      case "fill":
        return ["rectangle", "circle", "text", "frame"].includes(selectedObject.type)
      case "stroke":
        return ["rectangle", "circle"].includes(selectedObject.type)
      default:
        return true
    }
  }

  if (!selectedObject) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h2 className="text-sm font-semibold">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-muted-foreground text-center">Select an object to view properties</p>
        </div>
      </div>
    )
  }

  const renderSection = (section: PropertySection, index: number, content: React.ReactNode) => {
    if (!shouldShowSection(section.id)) return null

    const isDragging = draggedSectionIndex === index
    const showDropIndicator = dropSectionIndex === index

    return (
      <div key={section.id}>
        {showDropIndicator && draggedSectionIndex !== index && <div className="h-0.5 bg-blue-500 mx-1 mb-2" />}
        <div
          draggable
          onDragStart={(e) => handleSectionDragStart(e, index)}
          onDragOver={(e) => handleSectionDragOver(e, index)}
          onDragEnd={handleSectionDragEnd}
          className={`space-y-2 ${isDragging ? "opacity-50" : ""}`}
          style={{
            transform:
              showDropIndicator && draggedSectionIndex !== null && draggedSectionIndex < index
                ? "translateY(4px)"
                : showDropIndicator && draggedSectionIndex !== null && draggedSectionIndex > index
                  ? "translateY(-4px)"
                  : "none",
            transition: "transform 0.2s",
          }}
        >
          <button
            onClick={() => toggleSection(section.id)}
            className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 group"
          >
            <div className="flex items-center gap-1">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
              <span>{section.title}</span>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform ${section.expanded ? "rotate-90" : ""}`} />
          </button>
          {section.expanded && <div className="pl-1">{content}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Properties</h2>
        <span className="text-xs text-muted-foreground capitalize">{selectedObject.type}</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {sections.map((section, index) => {
            // Position Section Content
            if (section.id === "position") {
              return renderSection(
                section,
                index,
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">X</Label>
                      <Input
                        type="number"
                        value={selectedObject.x}
                        onChange={(e) => updateObject(selectedObject.id, { x: Number(e.target.value) })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Y</Label>
                      <Input
                        type="number"
                        value={selectedObject.y}
                        onChange={(e) => updateObject(selectedObject.id, { y: Number(e.target.value) })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">W</Label>
                      <Input
                        type="number"
                        value={selectedObject.width}
                        onChange={(e) => updateObject(selectedObject.id, { width: Number(e.target.value) })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 mb-0"
                      onClick={() => setAspectLocked(!aspectLocked)}
                    >
                      {aspectLocked ? <Link2 className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                    </Button>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">H</Label>
                      <Input
                        type="number"
                        value={selectedObject.height}
                        onChange={(e) => updateObject(selectedObject.id, { height: Number(e.target.value) })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rotation</Label>
                    <Input
                      type="number"
                      value={selectedObject.rotation}
                      onChange={(e) => updateObject(selectedObject.id, { rotation: Number(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>,
              )
            }

            // Layout Section Content
            if (section.id === "layout") {
              return renderSection(
                section,
                index,
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    {["Left", "Center", "Right"].map((align) => (
                      <Button key={align} variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                        {align}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {["Top", "Middle", "Bottom"].map((align) => (
                      <Button key={align} variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                        {align}
                      </Button>
                    ))}
                  </div>
                </div>,
              )
            }

            // Appearance Section Content
            if (section.id === "appearance") {
              return renderSection(
                section,
                index,
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Opacity</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[selectedObject.opacity]}
                        onValueChange={([value]) => updateObject(selectedObject.id, { opacity: value })}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right">{selectedObject.opacity}%</span>
                    </div>
                  </div>
                  {selectedObject.cornerRadius !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Corner Radius</Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => setCornerLocked(!cornerLocked)}
                        >
                          {cornerLocked ? <Link2 className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
                        </Button>
                      </div>
                      {cornerLocked ? (
                        <Input
                          type="number"
                          value={selectedObject.cornerRadius}
                          onChange={(e) => updateObject(selectedObject.id, { cornerRadius: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {["TL", "TR", "BR", "BL"].map((corner) => (
                            <div key={corner} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{corner}</Label>
                              <Input type="number" defaultValue={selectedObject.cornerRadius} className="h-8 text-sm" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>,
              )
            }

            // Typography Section Content
            if (section.id === "typography" && selectedObject.type === "text") {
              return renderSection(
                section,
                index,
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Font Family</Label>
                    <Select
                      value={selectedObject.fontFamily}
                      onValueChange={(value) => updateObject(selectedObject.id, { fontFamily: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <Input
                        type="number"
                        value={selectedObject.fontSize}
                        onChange={(e) => updateObject(selectedObject.id, { fontSize: Number(e.target.value) })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Weight</Label>
                      <Select
                        value={selectedObject.fontWeight}
                        onValueChange={(value) => updateObject(selectedObject.id, { fontWeight: value })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">Regular</SelectItem>
                          <SelectItem value="500">Medium</SelectItem>
                          <SelectItem value="600">Semibold</SelectItem>
                          <SelectItem value="700">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Line Height</Label>
                      <Input
                        type="number"
                        value={selectedObject.lineHeight}
                        onChange={(e) => updateObject(selectedObject.id, { lineHeight: Number(e.target.value) })}
                        className="h-8 text-sm"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
                      <Input
                        type="number"
                        value={selectedObject.letterSpacing}
                        onChange={(e) => updateObject(selectedObject.id, { letterSpacing: Number(e.target.value) })}
                        className="h-8 text-sm"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {["left", "center", "right"].map((align) => (
                      <Button
                        key={align}
                        variant={selectedObject.textAlign === align ? "default" : "outline"}
                        size="sm"
                        className="flex-1 h-8 text-xs capitalize"
                        onClick={() => updateObject(selectedObject.id, { textAlign: align as any })}
                      >
                        {align}
                      </Button>
                    ))}
                  </div>
                </div>,
              )
            }

            // Fill Section Content
            if (section.id === "fill") {
              return renderSection(
                section,
                index,
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                      style={{ backgroundColor: selectedObject.fill }}
                    />
                    <Input
                      type="text"
                      value={selectedObject.fill}
                      onChange={(e) => updateObject(selectedObject.id, { fill: e.target.value })}
                      className="h-8 text-sm flex-1"
                    />
                  </div>
                </div>,
              )
            }

            // Stroke Section Content
            if (section.id === "stroke") {
              return renderSection(
                section,
                index,
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                      style={{ backgroundColor: selectedObject.stroke }}
                    />
                    <Input
                      type="text"
                      value={selectedObject.stroke || ""}
                      onChange={(e) => updateObject(selectedObject.id, { stroke: e.target.value })}
                      className="h-8 text-sm flex-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <Input
                      type="number"
                      value={selectedObject.strokeWidth || 0}
                      onChange={(e) => updateObject(selectedObject.id, { strokeWidth: Number(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>,
              )
            }

            // Effects Section Content
            if (section.id === "effects") {
              return renderSection(
                section,
                index,
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs bg-transparent">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Effect
                  </Button>
                </div>,
              )
            }

            // Export Section Content
            if (section.id === "export") {
              return renderSection(section, index, null)
            }

            return null
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
