"use client";

import type React from "react";
import type { CanvasObject } from "@/lib/types";
import {
  getComponentMetadata,
  getAllIngestedComponents,
} from "@/lib/utils/dynamic-component-registry";
import { Badge } from "@/ui/primitives/Badge";
import { Separator } from "@/ui/primitives/Separator";
import { Button } from "@/ui/primitives/Button";
import { Package, Code, Zap, RotateCcw, Copy, Download } from "lucide-react";
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
import { Switch } from "@/ui/primitives/Switch";
import { SimpleColorPicker } from "@/ui/assemblies/ColorPicker";
import { SliderWithInput } from "@/ui/assemblies/SliderWithInput";

interface ComponentPropsPanelProps {
  object: CanvasObject;
  onUpdateProps: (props: Record<string, any>) => void;
}

/**
 * Interactive props panel for component properties
 * @author @darianrosebrook
 */
export function ComponentPropsPanel({
  object,
  onUpdateProps,
}: ComponentPropsPanelProps) {
  if (object.type !== "component" || !object.componentType) {
    return null;
  }

  const metadata = getComponentMetadata(object.componentType as any);
  const currentProps = object.componentProps || {};

  // Get component source information
  const allComponents = getAllIngestedComponents();
  const componentInfo = allComponents.get(object.componentType.toLowerCase());

  const isLocalComponent = componentInfo?.source === "design-system";
  const isPackageComponent =
    componentInfo && componentInfo.source !== "design-system";

  const renderPropControl = (
    propName: string,
    propType: string,
    defaultValue: any
  ) => {
    const currentValue = currentProps[propName] ?? defaultValue;

    switch (propType) {
      case "string":
      case "text":
        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => onUpdateProps({ [propName]: e.target.value })}
            placeholder={`Enter ${propName}...`}
            className="w-full text-sm"
          />
        );

      case "number":
        const min = getNumberRange(propName).min;
        const max = getNumberRange(propName).max;
        const step = getNumberRange(propName).step;

        return (
          <SliderWithInput
            value={currentValue || 0}
            onChange={(value) => onUpdateProps({ [propName]: value })}
            min={min}
            max={max}
            step={step}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center justify-between">
            <Switch
              checked={Boolean(currentValue)}
              onCheckedChange={(checked) =>
                onUpdateProps({ [propName]: checked })
              }
            />
            <span className="text-xs text-muted-foreground ml-2">
              {currentValue ? "On" : "Off"}
            </span>
          </div>
        );

      case "variant":
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
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{option}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "color":
        return (
          <SimpleColorPicker
            color={currentValue || "#000000"}
            onChange={(color) => onUpdateProps({ [propName]: color })}
            showOpacity={false}
            showDocumentColors={false}
          />
        );

      default:
        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => onUpdateProps({ [propName]: e.target.value })}
            placeholder={`Enter ${propName}...`}
            className="w-full text-sm"
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
        return [
          "primary",
          "secondary",
          "tertiary",
          "surface",
          "elevated",
          "transparent",
        ];
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
    if (typeof defaultValue === "boolean") {
      return "boolean";
    }
    if (typeof defaultValue === "number") {
      return "number";
    }
    if (propName === "variant" || propName === "size") {
      return "variant";
    }
    if (propName.toLowerCase().includes("color")) {
      return "color";
    }
    if (
      [
        "padding",
        "margin",
        "backgroundColor",
        "borderRadius",
        "border",
        "shadow",
      ].includes(propName)
    ) {
      return "variant";
    }
    return "string";
  };

  const getNumberRange = (propName: string) => {
    switch (propName) {
      case "width":
      case "height":
      case "maxWidth":
      case "maxHeight":
      case "minWidth":
      case "minHeight":
        return { min: 0, max: 2000, step: 1 };
      case "opacity":
        return { min: 0, max: 100, step: 1 };
      case "rotation":
        return { min: -360, max: 360, step: 1 };
      case "borderRadius":
        return { min: 0, max: 100, step: 1 };
      case "fontSize":
        return { min: 8, max: 120, step: 1 };
      case "lineHeight":
        return { min: 0.5, max: 3, step: 0.1 };
      case "letterSpacing":
        return { min: -10, max: 10, step: 0.1 };
      default:
        return { min: 0, max: 100, step: 1 };
    }
  };

  const getPropLabel = (propName: string): string => {
    return propName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const componentProps = Object.entries(metadata?.defaultProps || {});

  const renderComponentSource = () => {
    if (isLocalComponent) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Code className="h-3 w-3" />
          <span>Local Component</span>
          <Badge variant="outline" className="text-xs">
            Design System
          </Badge>
        </div>
      );
    }

    if (isPackageComponent) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>Package Component</span>
            <Badge variant="outline" className="text-xs">
              {componentInfo?.source}
            </Badge>
          </div>
          {componentInfo?.version && (
            <div className="text-xs text-muted-foreground">
              Version: {componentInfo.version}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-3 w-3" />
        <span>Custom Component</span>
      </div>
    );
  };

  if (componentProps.length === 0) {
    return (
      <div className="space-y-4 p-3">
        {/* Component Source Info */}
        <div className="pb-3 border-b border-border">
          {renderComponentSource()}
        </div>

        <div className="text-sm text-muted-foreground text-center py-4">
          No editable properties for this component.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3">
      {/* Component Source Info */}
      <div className="pb-3 border-b border-border">
        {renderComponentSource()}

        {/* Component Description */}
        {metadata?.description && (
          <div className="mt-2 text-xs text-muted-foreground">
            {metadata.description}
          </div>
        )}
      </div>

      {/* Component Properties */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-sm font-medium">Properties</span>
        </div>

        <div className="space-y-4">
          {componentProps.map(([propName, defaultValue]) => {
            const currentValue = currentProps[propName] ?? defaultValue;
            const isModified =
              JSON.stringify(currentValue) !== JSON.stringify(defaultValue);

            return (
              <div key={propName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {getPropLabel(propName)}
                  </Label>
                  {isModified && (
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      title="Modified from default"
                    />
                  )}
                </div>
                {renderPropControl(
                  propName,
                  getPropType(propName, defaultValue),
                  defaultValue
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Separator />
      <div className="pt-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Quick Actions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateProps(metadata?.defaultProps || {})}
            className="h-7 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const config = JSON.stringify(
                {
                  componentType: object.componentType,
                  props: currentProps,
                },
                null,
                2
              );
              navigator.clipboard.writeText(config);
              // Could add a toast notification here
            }}
            className="h-7 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Config
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const config = JSON.stringify(
                {
                  componentType: object.componentType,
                  props: currentProps,
                  name: object.name,
                  source: componentInfo?.source,
                },
                null,
                2
              );
              const blob = new Blob([config], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${object.name || "component"}-config.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="h-7 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
