import * as React from "react";
import styles from "./textarea.module.scss";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(styles.textarea, className)}
      {...props}
    />
  );
}

// Component implementation

export { Textarea };
