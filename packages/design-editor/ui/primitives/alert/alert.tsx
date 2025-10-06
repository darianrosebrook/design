import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import styles from "./alert.module.scss";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  // Base styles now in SCSS - keeping Tailwind commented for reference
  // "/* relative */ /* w-full */ /* rounded-lg */ /* border */ /* px-4 */ /* py-3 */ /* text-sm */ /* grid */ /* has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] */ /* grid-cols-[0_1fr] */ /* has-[>svg]:gap-x-3 */ /* gap-y-0.5 */ /* items-start */ /* [&>svg]:size-4 */ /* [&>svg]:translate-y-0.5 */ /* [&>svg]:text-current */",
  styles.alert,
  {
    variants: {
      variant: {
        // Tailwind versions commented for reference:
        // default: "/* bg-card */ /* text-card-foreground */",
        // destructive: "/* text-destructive */ /* bg-card */ /* [&>svg]:text-current */ /* *:data-[slot=alert-description]:text-destructive/90 */",

        default: styles["alert--variant-default"],
        destructive: styles["alert--variant-destructive"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(styles.alert, styles.alertTitle, className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(styles.alert, styles.alertDescription, className)}
      {...props}
    />
  );
}

// Component implementation

export { Alert, AlertTitle, AlertDescription };
