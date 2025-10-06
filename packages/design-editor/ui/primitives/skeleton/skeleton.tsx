import styles from "./skeleton.module.scss";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(styles.skeleton, className)}
      {...props}
    />
  );
}

// Component implementation

export { Skeleton };
