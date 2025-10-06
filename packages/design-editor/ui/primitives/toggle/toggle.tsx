import { Toggle as TogglePrimitive } from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import styles from "./toggle.module.scss";
import { cn } from "@/lib/utils";

/**
 * Toggle component variant styles using CVA
 * @author @darianrosebrook
 */
const toggleVariants = cva(
  // Base styles now in SCSS - keeping Tailwind commented for reference
  // "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground",
  styles.toggle,
  {
    variants: {
      variant: {
        // Tailwind versions commented for reference:
        // default: "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        // outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        // secondary: "bg-secondary hover:bg-secondary/80 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
        // ghost: "hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",

        default: styles["toggle--variant-default"],
        outline: styles["toggle--variant-outline"],
        secondary: styles["toggle--variant-secondary"],
        ghost: styles["toggle--variant-ghost"],
      },
      size: {
        // Tailwind versions commented for reference:
        // default: "h-9 px-3",
        // sm: "h-8 px-2 text-xs",
        // lg: "h-10 px-4",

        default: styles["toggle--size-default"],
        sm: styles["toggle--size-sm"],
        lg: styles["toggle--size-lg"],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ToggleProps
  extends React.ComponentProps<typeof TogglePrimitive>,
    VariantProps<typeof toggleVariants> {}

/**
 * Toggle component for binary state control
 *
 * @param className - Additional CSS classes
 * @param variant - Visual variant of the toggle
 * @param size - Size of the toggle
 * @param ...props - Additional props passed to the underlying TogglePrimitive
 * @author @darianrosebrook
 */
function Toggle({ className, variant, size, ...props }: ToggleProps) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants, type ToggleProps };
