"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";
import { cn } from "@/lib/utils";
import styles from "./progress.module.scss";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      // Original Tailwind classes (commented for reference):
      // "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full"
      className={cn(styles.progress, className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // Original Tailwind classes (commented for reference):
        // "bg-primary h-full w-full flex-1 transition-all"
        className={styles.progressIndicator}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

// Component implementation

export { Progress };
