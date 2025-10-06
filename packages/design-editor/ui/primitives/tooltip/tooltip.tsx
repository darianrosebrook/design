import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tooltip component variant styles using CVA
 * @author @darianrosebrook
 */
const tooltipVariants = cva(
  "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-popover text-popover-foreground border-border",
        light: "bg-background text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Tooltip provider component
 * @author @darianrosebrook
 */
function TooltipProvider({
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider {...props}>{children}</TooltipPrimitive.Provider>
  );
}

/**
 * Tooltip root component
 * @author @darianrosebrook
 */
function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />;
}

/**
 * Tooltip trigger component
 * @author @darianrosebrook
 */
function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger asChild {...props} />;
}

export interface TooltipContentProps
  extends React.ComponentProps<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipVariants> {}

/**
 * Tooltip content component
 *
 * @param className - Additional CSS classes
 * @param variant - Visual variant of the tooltip
 * @param sideOffset - Offset from the trigger element
 * @param ...props - Additional props passed to the underlying TooltipPrimitive.Content
 * @author @darianrosebrook
 */
function TooltipContent({
  className,
  variant,
  sideOffset = 4,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Content
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(tooltipVariants({ variant, className }))}
      {...props}
    >
      {props.children}
      <TooltipPrimitive.Arrow className="fill-border" />
    </TooltipPrimitive.Content>
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  tooltipVariants,
  type TooltipContentProps,
};
