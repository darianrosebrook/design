"use client";

import { Palette, Grid3X3, Square, Circle } from "lucide-react";
import type React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCanvas } from "@/lib/canvas-context";

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
    <div className="space-y-4">
      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Background Color</Label>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg border border-border cursor-pointer flex items-center justify-center"
            style={{ backgroundColor: canvasBackgroundColor }}
            onClick={() => {
              // Create a color input and trigger it
              const input = document.createElement("input");
              input.type = "color";
              input.value = canvasBackgroundColor;
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                setCanvasBackgroundColor(target.value);
              };
              input.click();
            }}
          >
            <Palette className="h-4 w-4 text-white" />
          </div>
          <Input
            type="text"
            value={canvasBackgroundColor}
            onChange={(e) => setCanvasBackgroundColor(e.target.value)}
            className="h-8 text-sm flex-1"
            placeholder="#18181b"
          />
        </div>
      </div>

      {/* Background Type */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Background Type</Label>
        <div className="relative bg-muted/20 rounded-lg p-1">
          {/* Sliding background indicator */}
          <div
            className="absolute top-1 bottom-1 bg-card border border-border rounded-md transition-all duration-200 ease-out"
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

          <div className="relative flex">
            {backgroundOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = canvasBackground === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setCanvasBackground(option.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                    isSelected
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{option.label}</span>
                  <span className="text-xs opacity-60">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Preview</Label>
        <div
          className="w-full h-16 rounded-lg border border-border overflow-hidden"
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
