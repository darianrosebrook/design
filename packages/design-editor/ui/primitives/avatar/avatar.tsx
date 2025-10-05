"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";
import { cn } from "@/lib/utils";
import styles from "./avatar.module.scss";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      // Original Tailwind classes (commented for reference):
      // "relative flex size-8 shrink-0 overflow-hidden rounded-full"
      className={cn(styles.avatar, className)}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      // Original Tailwind classes (commented for reference):
      // "aspect-square size-full"
      className={cn(styles.avatarImage, className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      // Original Tailwind classes (commented for reference):
      // "bg-muted flex size-full items-center justify-center rounded-full"
      className={cn(styles.avatarFallback, className)}
      {...props}
    />
  );
}

// Component implementation

export { Avatar, AvatarImage, AvatarFallback };
