"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/primitives/Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/Select";
import { ColorCanvas } from "./ColorCanvas";
import { HueSlider } from "./HueSlider";
import { OpacitySlider } from "./OpacitySlider";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  hsvToRgb,
  rgbToOklch,
  clampToSrgbGamut,
  isInSrgbGamut,
} from "@/lib/utils/helpers/color";
import {
  parseCssColorToRgb,
  formatOklch,
} from "@/lib/utils/helpers/colorFormat";
import { useCanvas } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";

function extractColorsFromObjects(objects: CanvasObject[]): string[] {
  const colors = new Set<string>();

  objects.forEach((obj) => {
    // Extract colors from object properties
    if (obj.fill && typeof obj.fill === "string") {
      colors.add(obj.fill);
    }
    if (obj.stroke && typeof obj.stroke === "string") {
      colors.add(obj.stroke);
    }

    // Extract colors from text styling if available
    if (obj.type === "text" && obj.textColor) {
      colors.add(obj.textColor);
    }

    // Extract colors from gradients or other complex fills
    if (obj.gradient && Array.isArray(obj.gradient.colors)) {
      obj.gradient.colors.forEach((color: string) => colors.add(color));
    }
  });

  return Array.from(colors).filter((color) => {
    // Filter out invalid colors
    return hexToRgb(color) !== null;
  });
}

interface SimpleColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  showOpacity?: boolean;
  showDocumentColors?: boolean;
}

type ColorFormat = "hex" | "rgb" | "hsl" | "hsb" | "oklch" | "css";

/**
 * Simplified color picker for basic color selection
 * @author @darianrosebrook
 */
export function SimpleColorPicker({
  color,
  onChange,
  label = "Color",
  showOpacity = true,
  showDocumentColors = true,
}: SimpleColorPickerProps) {
  const { objects } = useCanvas();
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(color);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [opacity, setOpacity] = useState(100);
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");

  // Initialize color values
  useEffect(() => {
    const rgb = hexToRgb(currentColor);
    if (rgb) {
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setBrightness(hsv.v);
    }
  }, [currentColor]);

  const handleColorChange = (
    newHue: number,
    newSaturation: number,
    newBrightness: number
  ) => {
    setHue(newHue);
    setSaturation(newSaturation);
    setBrightness(newBrightness);

    let rgb = hsvToRgb(newHue, newSaturation, newBrightness);

    // Ensure color is within sRGB gamut
    if (!isInSrgbGamut(rgb)) {
      rgb = clampToSrgbGamut(rgb);
    }

    const hex = rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b });
    setCurrentColor(hex);
    onChange(hex);
  };

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    let rgb = hsvToRgb(newHue, saturation, brightness);

    // Ensure color is within sRGB gamut
    if (!isInSrgbGamut(rgb)) {
      rgb = clampToSrgbGamut(rgb);
    }

    const hex = rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b });
    setCurrentColor(hex);
    onChange(hex);
  };

  const handleSaturationBrightnessChange = (
    newSaturation: number,
    newBrightness: number
  ) => {
    setSaturation(newSaturation);
    setBrightness(newBrightness);
    let rgb = hsvToRgb(hue, newSaturation, newBrightness);

    // Ensure color is within sRGB gamut
    if (!isInSrgbGamut(rgb)) {
      rgb = clampToSrgbGamut(rgb);
    }

    const hex = rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b });
    setCurrentColor(hex);
    onChange(hex);
  };

  // Format color based on selected format
  const formatColor = (): string => {
    const rgb = hexToRgb(currentColor);
    switch (colorFormat) {
      case "rgb":
        return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
      case "hsl": {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return `${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(
          hsl.l
        )}%`;
      }
      case "hsb": {
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        return `${Math.round(hsv.h)}°, ${Math.round(hsv.s)}%, ${Math.round(
          hsv.v
        )}%`;
      }
      case "oklch": {
        const oklch = rgbToOklch(rgb);
        return formatOklch(oklch.L, oklch.c, oklch.h);
      }
      case "css":
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      default:
        return currentColor;
    }
  };

  // Get colors used in the document
  const documentColors = extractColorsFromObjects(objects);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 w-full">
          <div
            className="w-8 h-8 rounded-lg border border-border cursor-pointer hover:border-foreground/50 transition-colors"
            style={{ backgroundColor: color }}
          />
          <Input
            type="text"
            value={color}
            readOnly
            className="h-8 text-sm flex-1 cursor-pointer"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        side="left"
        sideOffset={8}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-end px-4 py-3 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Color picker canvas */}
          <div className="p-4 space-y-3">
            <ColorCanvas
              hue={hue}
              saturation={saturation}
              brightness={brightness}
              onChange={handleSaturationBrightnessChange}
              width={284}
              height={220}
            />

            {/* Hue slider */}
            <HueSlider hue={hue} onChange={handleHueChange} width={284} />

            {/* Opacity slider */}
            {showOpacity && (
              <OpacitySlider
                opacity={opacity}
                color={currentColor}
                onChange={setOpacity}
                width={284}
              />
            )}

            {/* Color format and value */}
            <div className="flex items-center gap-2">
              <Select
                value={colorFormat}
                onValueChange={(v) => setColorFormat(v as ColorFormat)}
              >
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hex">Hex</SelectItem>
                  <SelectItem value="rgb">RGB</SelectItem>
                  <SelectItem value="hsl">HSL</SelectItem>
                  <SelectItem value="hsb">HSB</SelectItem>
                  <SelectItem value="oklch">OKLCH</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                value={formatColor()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (colorFormat === "hex") {
                    setCurrentColor(value);
                    onChange(value);
                  } else if (colorFormat === "oklch") {
                    // Parse OKLCH and convert to RGB, then to hex
                    const parsedRgb = parseCssColorToRgb(value);
                    if (parsedRgb) {
                      // Ensure color is within sRGB gamut
                      let rgb = parsedRgb;
                      if (!isInSrgbGamut(rgb)) {
                        rgb = clampToSrgbGamut(rgb);
                      }

                      const hex = rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b });
                      setCurrentColor(hex);
                      onChange(hex);
                      // Update HSV values
                      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
                      setHue(hsv.h);
                      setSaturation(hsv.s);
                      setBrightness(hsv.v);
                    }
                  }
                }}
                className="h-8 text-sm flex-1 font-mono"
              />
              {showOpacity && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={
                      isNaN(opacity) ||
                      opacity === null ||
                      opacity === undefined
                        ? 100
                        : Math.round(Number(opacity))
                    }
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setOpacity(
                        isNaN(value) ? 100 : Math.max(0, Math.min(100, value))
                      );
                    }}
                    className="h-8 w-16 text-sm"
                    min={0}
                    max={100}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              )}
            </div>

            {/* Document colors */}
            {showDocumentColors && documentColors.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  On this page
                </div>
                <div className="flex flex-wrap gap-2">
                  {documentColors.slice(0, 8).map((docColor) => (
                    <button
                      key={docColor}
                      className="w-8 h-8 rounded border border-border hover:border-foreground/50 transition-colors"
                      style={{ backgroundColor: docColor }}
                      onClick={() => {
                        setCurrentColor(docColor);
                        onChange(docColor);
                        const rgb = hexToRgb(docColor);
                        if (rgb) {
                          const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
                          setHue(hsv.h);
                          setSaturation(hsv.s);
                          setBrightness(hsv.v);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
