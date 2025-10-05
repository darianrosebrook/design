import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import styles from "./breadcrumb.module.scss";

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      // Original Tailwind classes (commented for reference):
      // "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5"
      className={cn(styles.breadcrumbList, className)}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      // Original Tailwind classes (commented for reference):
      // "inline-flex items-center gap-1.5"
      className={cn(styles.breadcrumbItem, className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      // Original Tailwind classes (commented for reference):
      // "hover:text-foreground transition-colors"
      className={cn(styles.breadcrumbLink, className)}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      // Original Tailwind classes (commented for reference):
      // "text-foreground font-normal"
      className={cn(styles.breadcrumbPage, className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      // Original Tailwind classes (commented for reference):
      // "[&>svg]:size-3.5"
      className={cn(styles.breadcrumbSeparator, className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      // Original Tailwind classes (commented for reference):
      // "flex size-9 items-center justify-center"
      className={cn(styles.breadcrumbEllipsis, className)}
      {...props}
    >
      <MoreHorizontal className={styles.breadcrumbEllipsisIcon} />
      <span className="sr-only">More</span>
    </span>
  );
}

// Component implementation

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
