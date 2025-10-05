"use client";

import {
  ChevronRight,
  Link2,
  Unlink,
  Plus,
  GripVertical,
  Square,
  Type,
  Circle,
  ImageIcon,
  LayersIcon,
  Frame,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignTop,
  AlignMiddle,
  AlignBottom,
  MoreHorizontal,
  Settings,
  Info,
} from "@/lib/components/icons";
import React from "react";
import { useState } from "react";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { Label } from "@/ui/primitives/Label";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/Select";
import { Slider } from "@/ui/primitives/Slider";
import { useCanvas, findObject } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";
import { CanvasBackgroundControls } from "@/ui/composers/CanvasBackgroundControls";
// Component props panel temporarily removed

interface PropertySection {
  id: string;
  title: string;
  expanded: boolean;
}

export function PropertiesPanel() {
  const { objects, selectedId, updateObject } = useCanvas();
  const [sections, setSections] = useState<PropertySection[]>([
    { id: "layout", title: "Layout", expanded: true },
    { id: "position", title: "Position", expanded: true },
    { id: "appearance", title: "Appearance", expanded: true },
    { id: "typography", title: "Typography", expanded: false },
    { id: "effects", title: "Effects", expanded: false },
  ]);

  const [aspectLocked, setAspectLocked] = useState(true);
  const [cornerLocked, setCornerLocked] = useState(true);

  // Find selected object
  const selectedObject = selectedId ? findObject(objects, selectedId) : null;

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };

  if (!selectedObject) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h2 className="text-sm font-semibold">Properties</h2>
          <span className="text-xs text-muted-foreground">Canvas</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3">
            <CanvasBackgroundControls />
          </div>
        </ScrollArea>
      </div>
    );
  }

  const renderSection = (
    section: PropertySection,
    index: number,
    content: React.ReactNode
  ) => {
    return (
      <div key={section.id} className="space-y-2">
        <button
          onClick={() => toggleSection(section.id)}
          className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 group"
        >
          <div className="flex items-center gap-1">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            <span>{section.title}</span>
          </div>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              section.expanded ? "rotate-90" : ""
            }`}
          />
        </button>
        {section.expanded && <div className="pl-1">{content}</div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Properties</h2>
        <span className="text-xs text-muted-foreground capitalize">
          {selectedObject.type}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Component Props Panel - Temporarily disabled */}
          {selectedObject.type === "component" && (
            <div className="p-3 text-sm text-muted-foreground">
              Component properties panel temporarily disabled
            </div>
          )}

          {/* Position Section */}
          {renderSection(
            sections.find((s) => s.id === "position")!,
            0,
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">X</Label>
                  <Input
                    type="number"
                    value={selectedObject.x}
                    onChange={(e) =>
                      updateObject(selectedObject.id, {
                        x: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Y</Label>
                  <Input
                    type="number"
                    value={selectedObject.y}
                    onChange={(e) =>
                      updateObject(selectedObject.id, {
                        y: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                <div>
                  <Label className="text-xs text-muted-foreground">W</Label>
                  <Input
                    type="number"
                    value={selectedObject.width}
                    onChange={(e) =>
                      updateObject(selectedObject.id, {
                        width: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mb-0"
                  onClick={() => setAspectLocked(!aspectLocked)}
                >
                  {aspectLocked ? (
                    <Link2 className="h-3.5 w-3.5" />
                  ) : (
                    <Unlink className="h-3.5 w-3.5" />
                  )}
                </Button>
                <div>
                  <Label className="text-xs text-muted-foreground">H</Label>
                  <Input
                    type="number"
                    value={selectedObject.height}
                    onChange={(e) =>
                      updateObject(selectedObject.id, {
                        height: Number(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Rotation
                </Label>
                <Input
                  type="number"
                  value={selectedObject.rotation}
                  onChange={(e) =>
                    updateObject(selectedObject.id, {
                      rotation: Number(e.target.value),
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Layout Section */}
          {renderSection(
            sections.find((s) => s.id === "layout")!,
            1,
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Auto Layout
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => {
                    // TODO: Implement auto layout toggle
                    console.log("Auto layout toggle not implemented");
                  }}
                >
                  Enable Auto Layout
                </Button>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {renderSection(
            sections.find((s) => s.id === "appearance")!,
            2,
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Opacity</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[selectedObject.opacity]}
                    onValueChange={([value]) =>
                      updateObject(selectedObject.id, { opacity: value })
                    }
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {selectedObject.opacity}%
                  </span>
                </div>
              </div>
              {selectedObject.cornerRadius !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Corner Radius
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setCornerLocked(!cornerLocked)}
                    >
                      {cornerLocked ? (
                        <Link2 className="h-3 w-3" />
                      ) : (
                        <Unlink className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {cornerLocked ? (
                    <Input
                      type="number"
                      value={selectedObject.cornerRadius}
                      onChange={(e) =>
                        updateObject(selectedObject.id, {
                          cornerRadius: Number(e.target.value),
                        })
                      }
                      className="h-8 text-sm"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {["TL", "TR", "BR", "BL"].map((corner) => (
                        <div key={corner} className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {corner}
                          </Label>
                          <Input
                            type="number"
                            defaultValue={selectedObject.cornerRadius}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Typography Section */}
          {selectedObject.type === "text" &&
            renderSection(
              sections.find((s) => s.id === "typography")!,
              3,
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Font Family
                  </Label>
                  <Select
                    value={selectedObject.fontFamily}
                    onValueChange={(value) =>
                      updateObject(selectedObject.id, { fontFamily: value })
                    }
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
                    <Label className="text-xs text-muted-foreground">
                      Size
                    </Label>
                    <Input
                      type="number"
                      value={selectedObject.fontSize}
                      onChange={(e) =>
                        updateObject(selectedObject.id, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Weight
                    </Label>
                    <Select
                      value={selectedObject.fontWeight}
                      onValueChange={(value) =>
                        updateObject(selectedObject.id, { fontWeight: value })
                      }
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
                    <Label className="text-xs text-muted-foreground">
                      Line Height
                    </Label>
                    <Input
                      type="number"
                      value={selectedObject.lineHeight}
                      onChange={(e) =>
                        updateObject(selectedObject.id, {
                          lineHeight: Number(e.target.value),
                        })
                      }
                      className="h-8 text-sm"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Letter Spacing
                    </Label>
                    <Input
                      type="number"
                      value={selectedObject.letterSpacing}
                      onChange={(e) =>
                        updateObject(selectedObject.id, {
                          letterSpacing: Number(e.target.value),
                        })
                      }
                      className="h-8 text-sm"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  {["left", "center", "right"].map((align) => (
                    <Button
                      key={align}
                      variant={
                        selectedObject.textAlign === align
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="flex-1 h-8 text-xs capitalize"
                      onClick={() =>
                        updateObject(selectedObject.id, {
                          textAlign: align as any,
                        })
                      }
                    >
                      {align}
                    </Button>
                  ))}
                </div>
              </div>
            )}

          {/* Effects Section */}
          {renderSection(
            sections.find((s) => s.id === "effects")!,
            4,
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs bg-transparent"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Effect
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
