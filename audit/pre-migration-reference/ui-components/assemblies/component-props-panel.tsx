"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import type { CanvasObject } from "@/lib/types";
import { getComponentMetadata } from "./component-renderer";

interface ComponentPropsPanelProps {
  object: CanvasObject;
  onUpdateProps: (props: Record<string, any>) => void;
}

/**
 * Interactive props panel for component properties
 * @author @darianrosebrook
 */
export function ComponentPropsPanel({ object, onUpdateProps }: ComponentPropsPanelProps) {
  if (object.type !== "component" || !object.componentType) {
    return null;
  }

  const metadata = getComponentMetadata(object.componentType as any);
  const currentProps = object.componentProps || {};

  const renderPropControl = (propName: string, propType: string, defaultValue: any) => {
    const currentValue = currentProps[propName] ?? defaultValue;

    switch (propType) {
      case "string":
      case "text":
        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => onUpdateProps({ [propName]: e.target.value })}
            placeholder={`Enter ${propName}...`}
            className="w-full"
          />
        );

      case "number":
        return (
          <div className="space-y-2">
            <Slider
              value={[currentValue || 0]}
              onValueChange={([value]) => onUpdateProps({ [propName]: value })}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <Input
              type="number"
              value={currentValue || 0}
              onChange={(e) => onUpdateProps({ [propName]: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        );

      case "boolean":
        return (
          <Switch
            checked={currentValue || false}
            onCheckedChange={(checked) => onUpdateProps({ [propName]: checked })}
          />
        );

      case "variant":
        // Handle variant props with predefined options
        const variantOptions = getVariantOptions(propName);
        return (
          <Select
            value={currentValue || variantOptions[0]}
            onValueChange={(value) => onUpdateProps({ [propName]: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variantOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => onUpdateProps({ [propName]: e.target.value })}
            placeholder={`Enter ${propName}...`}
            className="w-full"
          />
        );
    }
  };

  const getVariantOptions = (propName: string): string[] => {
    switch (propName) {
      case "variant":
        return ["primary", "secondary", "destructive"];
      case "size":
        return ["sm", "md", "lg"];
      case "padding":
      case "margin":
        return ["none", "xs", "sm", "md", "lg", "xl"];
      case "backgroundColor":
        return ["primary", "secondary", "tertiary", "surface", "elevated", "transparent"];
      case "borderRadius":
        return ["none", "sm", "md", "lg", "xl", "full"];
      case "border":
        return ["none", "subtle", "default", "strong"];
      case "shadow":
        return ["none", "sm", "md", "lg", "xl"];
      default:
        return [];
    }
  };

  const getPropType = (propName: string, defaultValue: any): string => {
    if (typeof defaultValue === "boolean") return "boolean";
    if (typeof defaultValue === "number") return "number";
    if (propName === "variant" || propName === "size") return "variant";
    if (["padding", "margin", "backgroundColor", "borderRadius", "border", "shadow"].includes(propName)) {
      return "variant";
    }
    return "string";
  };

  const getPropLabel = (propName: string): string => {
    return propName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const componentProps = Object.entries(metadata.defaultProps || {});

  if (componentProps.length === 0) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        No editable properties for this component.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-sm font-medium">Properties</span>
        </div>
        
        <div className="space-y-4">
          {componentProps.map(([propName, defaultValue]) => (
            <div key={propName} className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {getPropLabel(propName)}
              </Label>
              {renderPropControl(propName, getPropType(propName, defaultValue), defaultValue)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Props panel for primitive components (rectangle, circle, text, etc.)
 */
export function PrimitivePropsPanel({ object, onUpdateProps }: ComponentPropsPanelProps) {
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
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Opacity
            </Label>
            <div className="space-y-2">
              <Slider
                value={[object.opacity || 100]}
                onValueChange={([value]) => handleUpdate({ opacity: value })}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <Input
                type="number"
                value={object.opacity || 100}
                onChange={(e) => handleUpdate({ opacity: Number(e.target.value) })}
                className="w-full"
                min={0}
                max={100}
              />
            </div>
          </div>

          {/* Corner Radius (for shapes) */}
          {(object.type === "rectangle" || object.type === "frame") && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Corner Radius
              </Label>
              <Input
                type="number"
                value={object.cornerRadius || 0}
                onChange={(e) => handleUpdate({ cornerRadius: Number(e.target.value) })}
                className="w-full"
                min={0}
              />
            </div>
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
                  Font Size
                </Label>
                <Input
                  type="number"
                  value={object.fontSize || 16}
                  onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
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
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
