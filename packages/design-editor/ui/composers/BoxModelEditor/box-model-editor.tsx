"use client";

import { Link2, Unlink } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Label } from '@/ui/primitives/label';
import type { CanvasObject } from "@/lib/types";

interface BoxModelEditorProps {
  object: CanvasObject;
  onUpdate: (updates: Partial<CanvasObject>) => void;
}

interface BoxModelValues {
  margin: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
  content: { width: number; height: number };
}

export function BoxModelEditor({ object, onUpdate }: BoxModelEditorProps) {
  const [linked, setLinked] = useState({
    margin: true,
    padding: true,
    border: true,
  });

  const [values, setValues] = useState<BoxModelValues>({
    margin: {
      top: object.marginTop || 0,
      right: object.marginRight || 0,
      bottom: object.marginBottom || 0,
      left: object.marginLeft || 0,
    },
    padding: {
      top: object.paddingTop || 0,
      right: object.paddingRight || 0,
      bottom: object.paddingBottom || 0,
      left: object.paddingLeft || 0,
    },
    border: {
      top: object.borderTopWidth || 0,
      right: object.borderRightWidth || 0,
      bottom: object.borderBottomWidth || 0,
      left: object.borderLeftWidth || 0,
    },
    content: {
      width: object.width,
      height: object.height,
    },
  });

  const updateValue = (
    section: keyof BoxModelValues,
    property: string,
    value: number
  ) => {
    const newValues = { ...values };
    (newValues[section] as any)[property] = value;

    // If linked, update all sides
    if (linked[section as keyof typeof linked]) {
      const sides = ["top", "right", "bottom", "left"];
      sides.forEach((side) => {
        (newValues[section] as any)[side] = value;
      });
    }

    setValues(newValues);

    // Update the object
    const updates: Partial<CanvasObject> = {};
    if (section === "content") {
      updates.width = newValues.content.width;
      updates.height = newValues.content.height;
    } else {
      Object.entries(newValues[section]).forEach(([key, val]) => {
        const propName = `${section}${
          key.charAt(0).toUpperCase() + key.slice(1)
        }` as keyof CanvasObject;
        (updates as any)[propName] = val;
      });
    }

    onUpdate(updates);
  };

  const renderInput = (
    section: keyof BoxModelValues,
    property: string,
    label: string
  ) => {
    const value = (values[section] as any)[property];
    const isLinked = linked[section as keyof typeof linked];

    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              updateValue(section, property, Number(e.target.value))
            }
            className="h-7 text-xs"
            step="0.1"
          />
          {isLinked && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setLinked({ ...linked, [section]: false })}
            >
              <Link2 className="h-3 w-3" />
            </Button>
          )}
          {!isLinked && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setLinked({ ...linked, [section]: true })}
            >
              <Unlink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Visual Box Model Representation */}
      <div className="relative p-4 bg-muted/20 rounded-lg">
        <div className="relative mx-auto" style={{ width: 120, height: 80 }}>
          {/* Margin */}
          <div
            className="absolute border-2 border-dashed border-blue-300 bg-blue-50/20"
            style={{
              top: -values.margin.top,
              right: -values.margin.right,
              bottom: -values.margin.bottom,
              left: -values.margin.left,
            }}
          />

          {/* Border */}
          <div
            className="absolute border-2 border-orange-300 bg-orange-50/20"
            style={{
              top: -values.margin.top - values.border.top,
              right: -values.margin.right - values.border.right,
              bottom: -values.margin.bottom - values.border.bottom,
              left: -values.margin.left - values.border.left,
            }}
          />

          {/* Padding */}
          <div
            className="absolute border-2 border-green-300 bg-green-50/20"
            style={{
              top: -values.margin.top - values.border.top - values.padding.top,
              right:
                -values.margin.right -
                values.border.right -
                values.padding.right,
              bottom:
                -values.margin.bottom -
                values.border.bottom -
                values.padding.bottom,
              left:
                -values.margin.left - values.border.left - values.padding.left,
            }}
          />

          {/* Content */}
          <div
            className="absolute border-2 border-purple-300 bg-purple-50/20 flex items-center justify-center text-xs font-medium"
            style={{
              width: values.content.width,
              height: values.content.height,
            }}
          >
            Content
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-2 left-2 text-xs text-blue-600 font-medium">
          Margin
        </div>
        <div className="absolute top-2 right-2 text-xs text-orange-600 font-medium">
          Border
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-green-600 font-medium">
          Padding
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-purple-600 font-medium">
          Content
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Content */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Content</Label>
          <div className="grid grid-cols-2 gap-2">
            {renderInput("content", "width", "W")}
            {renderInput("content", "height", "H")}
          </div>
        </div>

        {/* Padding */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Padding</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setLinked({ ...linked, padding: !linked.padding })}
            >
              {linked.padding ? (
                <Link2 className="h-3 w-3" />
              ) : (
                <Unlink className="h-3 w-3" />
              )}
            </Button>
          </div>
          {linked.padding ? (
            <Input
              type="number"
              value={values.padding.top}
              onChange={(e) =>
                updateValue("padding", "top", Number(e.target.value))
              }
              className="h-7 text-xs"
              step="0.1"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">T</Label>
                <Input
                  type="number"
                  value={values.padding.top}
                  onChange={(e) =>
                    updateValue("padding", "top", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">R</Label>
                <Input
                  type="number"
                  value={values.padding.right}
                  onChange={(e) =>
                    updateValue("padding", "right", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">B</Label>
                <Input
                  type="number"
                  value={values.padding.bottom}
                  onChange={(e) =>
                    updateValue("padding", "bottom", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">L</Label>
                <Input
                  type="number"
                  value={values.padding.left}
                  onChange={(e) =>
                    updateValue("padding", "left", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Border */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Border</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setLinked({ ...linked, border: !linked.border })}
            >
              {linked.border ? (
                <Link2 className="h-3 w-3" />
              ) : (
                <Unlink className="h-3 w-3" />
              )}
            </Button>
          </div>
          {linked.border ? (
            <Input
              type="number"
              value={values.border.top}
              onChange={(e) =>
                updateValue("border", "top", Number(e.target.value))
              }
              className="h-7 text-xs"
              step="0.1"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">T</Label>
                <Input
                  type="number"
                  value={values.border.top}
                  onChange={(e) =>
                    updateValue("border", "top", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">R</Label>
                <Input
                  type="number"
                  value={values.border.right}
                  onChange={(e) =>
                    updateValue("border", "right", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">B</Label>
                <Input
                  type="number"
                  value={values.border.bottom}
                  onChange={(e) =>
                    updateValue("border", "bottom", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">L</Label>
                <Input
                  type="number"
                  value={values.border.left}
                  onChange={(e) =>
                    updateValue("border", "left", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Margin */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Margin</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setLinked({ ...linked, margin: !linked.margin })}
            >
              {linked.margin ? (
                <Link2 className="h-3 w-3" />
              ) : (
                <Unlink className="h-3 w-3" />
              )}
            </Button>
          </div>
          {linked.margin ? (
            <Input
              type="number"
              value={values.margin.top}
              onChange={(e) =>
                updateValue("margin", "top", Number(e.target.value))
              }
              className="h-7 text-xs"
              step="0.1"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">T</Label>
                <Input
                  type="number"
                  value={values.margin.top}
                  onChange={(e) =>
                    updateValue("margin", "top", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">R</Label>
                <Input
                  type="number"
                  value={values.margin.right}
                  onChange={(e) =>
                    updateValue("margin", "right", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">B</Label>
                <Input
                  type="number"
                  value={values.margin.bottom}
                  onChange={(e) =>
                    updateValue("margin", "bottom", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">L</Label>
                <Input
                  type="number"
                  value={values.margin.left}
                  onChange={(e) =>
                    updateValue("margin", "left", Number(e.target.value))
                  }
                  className="h-7 text-xs"
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
