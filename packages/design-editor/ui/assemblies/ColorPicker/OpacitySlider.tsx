"use client";

import type React from "react";
import { useRef, useEffect } from "react";

interface OpacitySliderProps {
  opacity: number;
  color: string;
  onChange: (opacity: number) => void;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Canvas-based opacity slider component
 * @author @darianrosebrook
 */
export function OpacitySlider({
  opacity,
  color,
  onChange,
  width = 368,
  height = 16,
  className = "",
}: OpacitySliderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw opacity gradient
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
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
    gradient.addColorStop(0, `${color}00`);
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [color]);

  const handleOpacityClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width, e.clientX - rect.left));
    const o = Math.max(0, Math.min(100, (x / canvas.width) * 100));

    onChange(o);
  };

  const getCursorPosition = () => {
    const left = (opacity / 100) * width - 8;
    return { left: Math.max(0, Math.min(width - 16, left)) };
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full rounded cursor-pointer ${className}`}
        onClick={handleOpacityClick}
      />
      <div
        className="absolute top-0 w-4 h-4 border-2 border-white rounded-full pointer-events-none shadow-lg"
        style={getCursorPosition()}
      />
    </div>
  );
}
