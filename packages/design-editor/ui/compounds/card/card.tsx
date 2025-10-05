import * as React from "react";
import { cn } from "@/lib/utils";
import styles from "./card.module.scss";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      // Original Tailwind classes (commented for reference):
      // "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
      className={cn(styles.card, className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      // Original Tailwind classes (commented for reference):
      // "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
      className={cn(styles.cardHeader, className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      // Original Tailwind classes (commented for reference):
      // "leading-none font-semibold"
      className={cn(styles.cardTitle, className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      // Original Tailwind classes (commented for reference):
      // "text-muted-foreground text-sm"
      className={cn(styles.cardDescription, className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      // Original Tailwind classes (commented for reference):
      // "col-start-2 row-span-2 row-start-1 self-start justify-self-end"
      className={cn(styles.cardAction, className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      // Original Tailwind classes (commented for reference):
      // "px-6"
      className={cn(styles.cardContent, className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      // Original Tailwind classes (commented for reference):
      // "flex items-center px-6 [.border-t]:pt-6"
      className={cn(styles.cardFooter, className)}
      {...props}
    />
  );
}

// Component implementation

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
