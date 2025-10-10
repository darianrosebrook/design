"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { X, Pipette, Check, AlertCircle, Type } from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { Label } from "@/ui/primitives/Label";
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
import { Tabs, TabsList, TabsTrigger } from "@/ui/primitives/Tabs";
import { useCanvas } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  hsvToRgb,
  contrastRatio,
  meetsContrastRequirement,
  requiredLuminanceForContrast,
  labToRgb,
  rgbToLab,
  deltaE2000,
  rgbToOklch,
  oklchToRgb,
  clampToSrgbGamut,
  isInSrgbGamut,
} from "@/lib/utils/helpers/color";
import {
  parseCssColorToRgb,
  formatOklch,
} from "@/lib/utils/helpers/colorFormat";
import { checkContrast, type ContrastResult } from "./ContrastChecker";

// Utility functions
function findNearestCompliantColor(
  foregroundHex: string,
  backgroundHex: string,
  targetRatio: number
): string {
  const fgRgb = hexToRgb(foregroundHex);
  const bgRgb = hexToRgb(backgroundHex);

  if (!fgRgb || !bgRgb) return foregroundHex;

  const fgLab = rgbToLab(fgRgb);
  const bgLab = rgbToLab(bgRgb);

  // Simple approach: adjust lightness to meet contrast
  const bgLuminance = relativeLuminance(bgRgb);
  const currentRatio = contrastRatio(fgRgb, bgRgb);

  if (currentRatio >= targetRatio) return foregroundHex;

  // Try to find a better color by adjusting lightness
  let bestColor = foregroundHex;
  let bestRatio = currentRatio;

  // Try different lightness adjustments
  for (let adjustment = -50; adjustment <= 50; adjustment += 5) {
    const newL = Math.max(0, Math.min(100, fgLab.l + adjustment));
    const newLab = { ...fgLab, l: newL };
    const newRgb = labToRgb(newLab);

    if (newRgb) {
      const newRatio = contrastRatio(newRgb, bgRgb);
      if (newRatio >= targetRatio && newRatio > bestRatio) {
        bestRatio = newRatio;
        bestColor = rgbToHex({ r: newRgb.r, g: newRgb.g, b: newRgb.b });
      }
    }
  }

  return bestColor;
}

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

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  selectedObject?: CanvasObject | null;
}

type ColorFormat = "hex" | "rgb" | "hsl" | "hsb" | "oklch" | "css";
type ContrastCategory = "auto" | "large-text" | "normal-text" | "graphics";
type ComplianceLevel = "aa" | "aaa";

export function ColorPicker({
  color,
  onChange,
  label = "Color",
  selectedObject,
}: ColorPickerProps) {
  const { objects } = useCanvas();
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(color);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [opacity, setOpacity] = useState(100);
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
  const [showContrast, setShowContrast] = useState(false);
  const [contrastCategory, setContrastCategory] =
    useState<ContrastCategory>("auto");
  const [complianceLevel, setComplianceLevel] = useState<ComplianceLevel>("aa");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const opacityCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Draw color picker canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw saturation/brightness gradient
    const baseColor = hsvToRgb(hue, 100, 100);
    const baseHex = rgbToHex({
      r: baseColor.r,
      g: baseColor.g,
      b: baseColor.b,
    });

    // White to color gradient (left to right)
    const gradientH = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradientH.addColorStop(0, "#FFFFFF");
    gradientH.addColorStop(1, baseHex);
    ctx.fillStyle = gradientH;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Transparent to black gradient (top to bottom)
    const gradientV = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradientV.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradientV.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = gradientV;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [hue]);

  // Draw hue slider
  useEffect(() => {
    if (!hueCanvasRef.current) return;
    const canvas = hueCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#FF0000");
    gradient.addColorStop(0.17, "#FFFF00");
    gradient.addColorStop(0.33, "#00FF00");
    gradient.addColorStop(0.5, "#00FFFF");
    gradient.addColorStop(0.67, "#0000FF");
    gradient.addColorStop(0.83, "#FF00FF");
    gradient.addColorStop(1, "#FF0000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Draw opacity slider
  useEffect(() => {
    if (!opacityCanvasRef.current) return;
    const canvas = opacityCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw checkered background
    const size = 8;
    for (let y = 0; y < canvas.height; y += size) {
      for (let x = 0; x < canvas.width; x += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#FFFFFF" : "#E0E0E0";
        ctx.fillRect(x, y, size, size);
      }
    }

    // Draw gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, `${currentColor}00`);
    gradient.addColorStop(1, currentColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [currentColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const s = (x / canvas.width) * 100;
    const b = 100 - (y / canvas.height) * 100;

    setSaturation(s);
    setBrightness(b);

    let rgb = hsvToRgb(hue, s, b);

    // Ensure color is within sRGB gamut
    if (!isInSrgbGamut(rgb)) {
      rgb = clampToSrgbGamut(rgb);
    }

    const hex = rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b });
    setCurrentColor(hex);
    onChange(hex);
  };

  const handleHueClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const h = (x / canvas.width) * 360;

    setHue(h);

    let rgb = hsvToRgb(h, saturation, brightness);

    // Ensure color is within sRGB gamut
    if (!isInSrgbGamut(rgb)) {
      rgb = clampToSrgbGamut(rgb);
    }

    const hex = rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b });
    setCurrentColor(hex);
    onChange(hex);
  };

  const handleOpacityClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = opacityCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const o = (x / canvas.width) * 100;

    setOpacity(o);
  };

  // Get background color for contrast checking
  const getBackgroundColor = (): string => {
    // Context-aware background detection
    // For now, return white as default, but this should be enhanced
    // to detect the actual background the object is sitting on
    return "#FFFFFF";
  };

  // Calculate contrast
  const contrastResult: ContrastResult = checkContrast(
    currentColor,
    getBackgroundColor()
  );

  // Determine which contrast threshold to use based on context
  const getContrastThreshold = (): number => {
    if (contrastCategory === "auto") {
      // Auto-detect based on selected object
      if (selectedObject?.type === "text") {
        const fontSize = selectedObject.fontSize || 16;
        return fontSize >= 18 ||
          (fontSize >= 14 && selectedObject.fontWeight === "700")
          ? complianceLevel === "aaa"
            ? 4.5
            : 3
          : complianceLevel === "aaa"
          ? 7
          : 4.5;
      }
      return complianceLevel === "aaa" ? 4.5 : 3;
    }

    if (contrastCategory === "large-text") {
      return complianceLevel === "aaa" ? 4.5 : 3;
    }

    if (contrastCategory === "normal-text") {
      return complianceLevel === "aaa" ? 7 : 4.5;
    }

    return complianceLevel === "aaa" ? 4.5 : 3; // graphics
  };

  const meetsContrast = contrastResult.ratio >= getContrastThreshold();

  // Auto-correct to nearest compliant color
  const handleAutoCorrect = () => {
    const threshold = getContrastThreshold();
    const corrected = findNearestCompliantColor(
      currentColor,
      getBackgroundColor(),
      threshold
    );
    setCurrentColor(corrected);
    onChange(corrected);

    const rgb = hexToRgb(corrected);
    if (rgb) {
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setBrightness(hsv.v);
    }
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
        className="w-[400px] p-0"
        align="start"
        side="left"
        sideOffset={8}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Tabs defaultValue="custom" className="flex-1">
              <TabsList className="h-8 bg-transparent p-0 gap-4">
                <TabsTrigger
                  value="custom"
                  className="text-sm data-[state=active]:bg-transparent"
                >
                  Custom
                </TabsTrigger>
                <TabsTrigger
                  value="libraries"
                  className="text-sm data-[state=active]:bg-transparent"
                >
                  Libraries
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pipette className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contrast indicator */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-sm font-medium">
                {contrastResult.ratio.toFixed(2)}:1
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowContrast(!showContrast)}
              >
                <Type className="h-3 w-3 mr-1" />
                AA
              </Button>
              {!meetsContrast && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleAutoCorrect}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                </Button>
              )}
              {meetsContrast && <Check className="h-4 w-4 text-green-500" />}
            </div>
          </div>

          {/* Contrast checker (collapsible) */}
          {showContrast && (
            <div className="px-4 py-3 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Foreground
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: currentColor }}
                    />
                    <span className="text-xs font-mono">{currentColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Background
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: getBackgroundColor() }}
                    />
                    <span className="text-xs font-mono">
                      {getBackgroundColor()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>
                    AA:{" "}
                    {complianceLevel === "aa" ? getContrastThreshold() : "4.5"}
                  </span>
                  {contrastResult.aa.normalText ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>
                    AAA:{" "}
                    {complianceLevel === "aaa" ? getContrastThreshold() : "7.0"}
                  </span>
                  {contrastResult.aaa.normalText ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Category
                  </Label>
                  <Select
                    value={contrastCategory}
                    onValueChange={(v) =>
                      setContrastCategory(v as ContrastCategory)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="large-text">Large text</SelectItem>
                      <SelectItem value="normal-text">Normal text</SelectItem>
                      <SelectItem value="graphics">Graphics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Level</Label>
                  <Select
                    value={complianceLevel}
                    onValueChange={(v) =>
                      setComplianceLevel(v as ComplianceLevel)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aa">AA</SelectItem>
                      <SelectItem value="aaa">AAA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Color picker canvas */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={368}
                height={280}
                className="w-full rounded-lg cursor-crosshair border border-border"
                onClick={handleCanvasClick}
              />
              {/* Color picker cursor */}
              <div
                className="absolute w-5 h-5 border-2 border-white rounded-full pointer-events-none shadow-lg"
                style={{
                  left: `${(saturation / 100) * 368 - 10}px`,
                  top: `${((100 - brightness) / 100) * 280 - 10}px`,
                }}
              />
            </div>

            {/* Hue slider */}
            <div className="relative">
              <canvas
                ref={hueCanvasRef}
                width={368}
                height={16}
                className="w-full rounded cursor-pointer"
                onClick={handleHueClick}
              />
              <div
                className="absolute top-0 w-4 h-4 border-2 border-white rounded-full pointer-events-none shadow-lg"
                style={{ left: `${(hue / 360) * 368 - 8}px` }}
              />
            </div>

            {/* Opacity slider */}
            <div className="relative">
              <canvas
                ref={opacityCanvasRef}
                width={368}
                height={16}
                className="w-full rounded cursor-pointer"
                onClick={handleOpacityClick}
              />
              <div
                className="absolute top-0 w-4 h-4 border-2 border-white rounded-full pointer-events-none shadow-lg"
                style={{ left: `${(opacity / 100) * 368 - 8}px` }}
              />
            </div>

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
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={isNaN(opacity) ? 100 : Math.round(opacity)}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="h-8 w-16 text-sm"
                  min={0}
                  max={100}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>

            {/* Document colors */}
            {documentColors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  On this page
                </Label>
                <div className="flex flex-wrap gap-2">
                  {documentColors.slice(0, 12).map((docColor) => (
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
