"use client";

import type React from "react";
import { useRef, useEffect } from "react";

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Canvas-based hue slider component
 * @author @darianrosebrook
 */
export function HueSlider({
  hue,
  onChange,
  width = 368,
  height = 16,
  className = "",
}: HueSliderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw hue gradient
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
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

  const handleHueClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width, e.clientX - rect.left));
    const h = Math.max(0, Math.min(360, (x / canvas.width) * 360));

    onChange(h);
  };

  const getCursorPosition = () => {
    const left = (hue / 360) * width - 8;
    return { left: Math.max(0, Math.min(width - 16, left)) };
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full rounded cursor-pointer ${className}`}
        onClick={handleHueClick}
      />
      <div
        className="absolute top-0 w-4 h-4 border-2 border-white rounded-full pointer-events-none shadow-lg"
        style={getCursorPosition()}
      />
    </div>
  );
}
