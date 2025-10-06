"use client";

import type React from "react";
import { useRef, useEffect } from "react";
import { hsvToRgb, rgbToHex } from "@/lib/utils/helpers/color";

interface ColorCanvasProps {
  hue: number;
  saturation: number;
  brightness: number;
  onChange: (saturation: number, brightness: number) => void;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Canvas-based color picker for saturation and brightness selection
 * @author @darianrosebrook
 */
export function ColorCanvas({
  hue,
  saturation,
  brightness,
  onChange,
  width = 368,
  height = 280,
  className = "",
}: ColorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw saturation/brightness gradient
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const s = Math.max(0, Math.min(100, (x / canvas.width) * 100));
    const b = Math.max(0, Math.min(100, 100 - (y / canvas.height) * 100));

    onChange(s, b);
  };

  const getCursorPosition = () => {
    const x = (saturation / 100) * width;
    const y = ((100 - brightness) / 100) * height;
    return { left: x - 10, top: y - 10 };
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full rounded-lg cursor-crosshair border border-border ${className}`}
        onClick={handleCanvasClick}
      />
      {/* Color picker cursor */}
      <div
        className="absolute w-5 h-5 border-2 border-white rounded-full pointer-events-none shadow-lg"
        style={getCursorPosition()}
      />
    </div>
  );
}
