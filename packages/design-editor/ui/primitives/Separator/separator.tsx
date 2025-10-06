"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";
import styles from "./separator.module.scss";
import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(styles.separator, className)}
      {...props}
    />
  );
}

// Component implementation

export { Separator };
