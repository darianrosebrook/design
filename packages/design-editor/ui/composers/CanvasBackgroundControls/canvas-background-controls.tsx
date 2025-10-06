"use client";

import { Label } from "@paths-design/design-system";
import { Palette, Grid3X3, Square, Circle } from "lucide-react";
import type React from "react";
import styles from "./canvas-background-controls.module.scss";
import { useCanvas } from "@/lib/canvas-context";
import { Input } from "@/ui/primitives/Input";

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
    <div className={styles.canvasBackgroundControls}>
      {/* Background Color */}
      <div className={styles.colorPickerSection}>
        <Label className={styles.colorPickerSectionLabel}>
          Background Color
        </Label>
        <div className={styles.colorPickerContainer}>
          <div
            className={styles.colorPickerSwatch}
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
            <Palette className={styles.colorPickerIcon} />
          </div>
          <Input
            type="text"
            value={canvasBackgroundColor}
            onChange={(e) => setCanvasBackgroundColor(e.target.value)}
            className={styles.colorInput}
            placeholder="#18181b"
          />
        </div>
      </div>

      {/* Background Type */}
      <div className={styles.backgroundTypeSection}>
        <Label className={styles.backgroundTypeSectionLabel}>
          Background Type
        </Label>
        <div className={styles.backgroundTypeSelector}>
          {/* Sliding background indicator */}
          <div
            className={styles.backgroundTypeIndicator}
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

          <div className={styles.backgroundTypeButtons}>
            {backgroundOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = canvasBackground === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setCanvasBackground(option.value)}
                  className={`${styles.backgroundTypeButton} ${
                    isSelected ? styles.selected : ""
                  }`}
                >
                  <Icon className={styles.backgroundTypeButtonIcon} />
                  <span className={styles.backgroundTypeButtonLabel}>
                    {option.label}
                  </span>
                  <span className={styles.backgroundTypeButtonDescription}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className={styles.previewSection}>
        <Label className={styles.previewSectionLabel}>Preview</Label>
        <div
          className={styles.previewContainer}
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
