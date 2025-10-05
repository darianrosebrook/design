import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "./empty.module.scss";

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      // Original Tailwind classes (commented for reference):
      // "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12"
      className={cn(styles.empty, className)}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      // Original Tailwind classes (commented for reference):
      // "flex max-w-sm flex-col items-center gap-2 text-center"
      className={cn(styles.emptyHeader, className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  // Base styles now in SCSS - keeping Tailwind commented for reference
  // "flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  styles.emptyMedia,
  {
    variants: {
      variant: {
        // Tailwind versions commented for reference:
        // default: "bg-transparent",
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
      // Original Tailwind classes (commented for reference):
      // "text-lg font-medium tracking-tight"
      className={cn(styles.emptyTitle, className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      // Original Tailwind classes (commented for reference):
      // "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4"
      className={cn(styles.emptyDescription, className)}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      // Original Tailwind classes (commented for reference):
      // "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance"
      className={cn(styles.emptyContent, className)}
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
