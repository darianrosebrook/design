"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";
import styles from "./avatar.module.scss";
import { cn } from "@/lib/utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
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
      // "aspect-square size-full"
      className={cn(styles.avatar, styles.avatarImage, className)}
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
      className={cn(styles.avatar, styles.avatarFallback, className)}
      {...props}
    />
  );
}

// Component implementation

export { Avatar, AvatarImage, AvatarFallback };
