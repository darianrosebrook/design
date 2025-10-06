"use client";

import { Label } from "@paths-design/design-system";
import { ChevronUp, ChevronDown } from "lucide-react";
import type React from "react";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showStepButtons?: boolean;
  precision?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  placeholder,
  disabled = false,
  className,
  showStepButtons = false,
  precision = 0,
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(
        min ?? -Infinity,
        Math.min(max ?? Infinity, newValue)
      );
      onChange(
        precision > 0
          ? parseFloat(clampedValue.toFixed(precision))
          : Math.round(clampedValue)
      );
    }
  };

  const increment = () => {
    const newValue = Math.max(
      min ?? -Infinity,
      Math.min(max ?? Infinity, value + step)
    );
    onChange(
      precision > 0
        ? parseFloat(newValue.toFixed(precision))
        : Math.round(newValue)
    );
  };

  const decrement = () => {
    const newValue = Math.max(
      min ?? -Infinity,
      Math.min(max ?? Infinity, value - step)
    );
    onChange(
      precision > 0
        ? parseFloat(newValue.toFixed(precision))
        : Math.round(newValue)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      increment();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      decrement();
    }
  };

  const inputElement = (
    <div className={`relative ${className}`}>
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        className={unit ? "pr-12" : showStepButtons ? "pr-8" : ""}
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {unit}
        </span>
      )}
      {showStepButtons && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            className="h-3 w-4 p-0 hover:bg-muted"
            onClick={increment}
            disabled={disabled || (max !== undefined && value >= max)}
          >
            <ChevronUp className="h-2 w-2" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-3 w-4 p-0 hover:bg-muted"
            onClick={decrement}
            disabled={disabled || (min !== undefined && value <= min)}
          >
            <ChevronDown className="h-2 w-2" />
          </Button>
        </div>
      )}
    </div>
  );

  if (label) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {inputElement}
      </div>
    );
  }

  return inputElement;
}
