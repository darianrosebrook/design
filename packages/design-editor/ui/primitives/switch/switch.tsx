"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";
import styles from "./switch.module.scss";
import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(styles.switch, className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={styles.switchThumb}
      />
    </SwitchPrimitive.Root>
  );
}

// Component implementation

export { Switch };
