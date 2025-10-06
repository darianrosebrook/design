import { cva, type VariantProps } from "class-variance-authority";
import styles from "./empty.module.scss";
import { cn } from "@/lib/utils";

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(styles.empty, className)}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(styles.empty, styles.emptyHeader, className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  // Base styles now in SCSS - keeping Tailwind commented for reference
  // "/* flex */ /* shrink-0 */ /* items-center */ /* justify-center */ /* mb-2 */ /* [&_svg]:pointer-events-none */ /* [&_svg]:shrink-0 */",
  styles.emptyMedia,
  {
    variants: {
      variant: {
        // Tailwind versions commented for reference:
        // default: "/* bg-transparent */",
        // icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",

        default: styles["emptyMedia--variant-default"],
        icon: styles["emptyMedia--variant-icon"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      // "text-lg font-medium tracking-tight"
      className={cn(styles.empty, styles.emptyTitle, className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      // "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4"
      className={cn(styles.empty, styles.emptyDescription, className)}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      // "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance"
      className={cn(styles.empty, styles.emptyContent, className)}
      {...props}
    />
  );
}

// Component implementation

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};
