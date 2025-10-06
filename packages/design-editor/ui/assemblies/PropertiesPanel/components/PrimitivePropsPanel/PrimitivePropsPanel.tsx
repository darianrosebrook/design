"use client";

import type React from "react";
import type { CanvasObject } from "@/lib/types";
import { Input } from "@/ui/primitives/Input";
import { Label } from "@paths-design/design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/Select";
import { Slider } from "@/ui/primitives/Slider";
import { ColorPicker } from "@/ui/assemblies/ColorPicker";
import { SliderWithInput } from "@/ui/assemblies/SliderWithInput";

interface PrimitivePropsPanelProps {
  object: CanvasObject;
  onUpdateProps: (props: Partial<CanvasObject>) => void;
}

/**
 * Props panel for primitive components (rectangle, circle, text, etc.)
 * @author @darianrosebrook
 */
export function PrimitivePropsPanel({
  object,
  onUpdateProps,
}: PrimitivePropsPanelProps) {
  const handleUpdate = (updates: Partial<CanvasObject>) => {
    onUpdateProps(updates);
  };

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Properties</span>
        </div>

        <div className="space-y-4">
          {/* Opacity */}
          <SliderWithInput
            label="Opacity"
            value={object.opacity ?? 100}
            onChange={(value) => handleUpdate({ opacity: value })}
            min={0}
            max={100}
            step={1}
          />

          {/* Corner Radius (for shapes) */}
          {(object.type === "rectangle" || object.type === "frame") && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Corner Radius
              </Label>
              <Input
                type="number"
                value={object.cornerRadius ?? 0}
                onChange={(e) =>
                  handleUpdate({ cornerRadius: Number(e.target.value) })
                }
                className="w-full"
                min={0}
              />
            </div>
          )}

          {/* Fill Color (for shapes) */}
          {(object.type === "rectangle" ||
            object.type === "circle" ||
            object.type === "frame") && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Fill Color
              </Label>
              <ColorPicker
                color={object.fill || "#ffffff"}
                onChange={(color) => handleUpdate({ fill: color })}
                selectedObject={object}
              />
            </div>
          )}

          {/* Stroke (for shapes) */}
          {(object.type === "rectangle" || object.type === "circle") && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Stroke Color
                </Label>
                <ColorPicker
                  color={object.stroke || "#000000"}
                  onChange={(color) => handleUpdate({ stroke: color })}
                  selectedObject={object}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Stroke Width
                </Label>
                <Input
                  type="number"
                  value={object.strokeWidth ?? 0}
                  onChange={(e) =>
                    handleUpdate({ strokeWidth: Number(e.target.value) })
                  }
                  className="w-full"
                  min={0}
                />
              </div>
            </>
          )}

          {/* Text properties */}
          {object.type === "text" && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Text
                </Label>
                <Input
                  value={object.text || ""}
                  onChange={(e) => handleUpdate({ text: e.target.value })}
                  placeholder="Enter text..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Font Family
                </Label>
                <Select
                  value={object.fontFamily || "Inter"}
                  onValueChange={(value) => handleUpdate({ fontFamily: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Font Size
                </Label>
                <Input
                  type="number"
                  value={object.fontSize ?? 16}
                  onChange={(e) =>
                    handleUpdate({ fontSize: Number(e.target.value) })
                  }
                  className="w-full"
                  min={8}
                  max={72}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Font Weight
                </Label>
                <Select
                  value={object.fontWeight || "normal"}
                  onValueChange={(value) => handleUpdate({ fontWeight: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="semibold">Semibold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Text Color
                </Label>
                <ColorPicker
                  color={object.fill || "#000000"}
                  onChange={(color) => handleUpdate({ fill: color })}
                  selectedObject={object}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Text Align
                </Label>
                <Select
                  value={object.textAlign || "left"}
                  onValueChange={(value: "left" | "center" | "right") =>
                    handleUpdate({ textAlign: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Line Height
                </Label>
                <Input
                  type="number"
                  value={object.lineHeight ?? 1.2}
                  onChange={(e) =>
                    handleUpdate({ lineHeight: Number(e.target.value) })
                  }
                  className="w-full"
                  step="0.1"
                  min={0.5}
                  max={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Letter Spacing
                </Label>
                <Input
                  type="number"
                  value={object.letterSpacing ?? 0}
                  onChange={(e) =>
                    handleUpdate({ letterSpacing: Number(e.target.value) })
                  }
                  className="w-full"
                  step="0.01"
                  min={-0.1}
                  max={0.5}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
