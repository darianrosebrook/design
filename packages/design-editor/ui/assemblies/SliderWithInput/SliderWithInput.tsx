"use client";

import type React from "react";
import { Input } from "@/ui/primitives/Input";
import { Slider } from "@/ui/primitives/Slider";

interface SliderWithInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Combined slider and input control for numeric values
 * @author @darianrosebrook
 */
export function SliderWithInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = "",
}: SliderWithInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
      )}
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      </div>
    </div>
  );
}
