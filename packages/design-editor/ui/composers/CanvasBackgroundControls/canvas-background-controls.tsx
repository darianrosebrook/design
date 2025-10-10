"use client";

import { Label } from "@paths-design/design-system";
import { Palette, Grid3X3, Square, Circle } from "lucide-react";
import type React from "react";
import { useCanvas } from "@/lib/canvas-context";
import { Input } from "@/ui/primitives/Input";
import { ColorPicker } from "@/ui/assemblies/ColorPicker";

export function CanvasBackgroundControls() {
  const {
    canvasBackground,
    setCanvasBackground,
    canvasBackgroundColor,
    setCanvasBackgroundColor,
  } = useCanvas();

  const backgroundOptions = [
    {
      value: "solid" as const,
      label: "Solid",
      icon: Square,
      description: "No grid",
    },
    {
      value: "dot-grid" as const,
      label: "Dot Grid",
      icon: Circle,
      description: "Dot pattern",
    },
    {
      value: "square-grid" as const,
      label: "Square Grid",
      icon: Grid3X3,
      description: "Square pattern",
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Background Color */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Background Color
        </Label>
        <ColorPicker
          color={canvasBackgroundColor}
          onChange={setCanvasBackgroundColor}
          label="Background Color"
        />
      </div>

      {/* Background Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Background Type
        </Label>
        <div className="relative">
          {/* Sliding background indicator */}
          <div
            className="absolute top-0 bottom-0 bg-primary/20 rounded-md transition-all duration-200"
            style={{
              left: `${
                (backgroundOptions.findIndex(
                  (opt) => opt.value === canvasBackground
                ) *
                  100) /
                  backgroundOptions.length +
                1
              }%`,
              width: `${100 / backgroundOptions.length - 2}%`,
            }}
          />

          <div className="grid grid-cols-3 gap-1">
            {backgroundOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = canvasBackground === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setCanvasBackground(option.value)}
                  className={`relative p-3 rounded-md border transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-accent border-border"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Preview
        </Label>
        <div
          className="w-full h-16 rounded-lg border border-border"
          style={{
            backgroundColor: canvasBackgroundColor,
            backgroundImage: getBackgroundStyle(canvasBackground),
            backgroundSize: "20px 20px",
          }}
        />
      </div>
    </div>
  );
}

function getBackgroundStyle(background: string) {
  switch (background) {
    case "dot-grid":
      return "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 1px, transparent 0)";
    case "square-grid":
      return `
        linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
      `;
    case "solid":
    default:
      return "none";
  }
}
