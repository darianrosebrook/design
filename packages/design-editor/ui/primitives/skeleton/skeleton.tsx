import { cn } from "@/lib/utils";
import styles from "./skeleton.module.scss";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // Original Tailwind classes (commented for reference):
      // "bg-accent animate-pulse rounded-md"
      className={cn(styles.skeleton, className)}
      {...props}
    />
  );
}

// Component implementation

export { Skeleton };
