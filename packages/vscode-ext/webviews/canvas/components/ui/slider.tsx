import * as React from "react";
import { cn } from "../../lib/utils";

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value = [0],
      onValueChange,
      max = 100,
      min = 0,
      step = 1,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [parseFloat(e.target.value)];
      onValueChange?.(newValue);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
