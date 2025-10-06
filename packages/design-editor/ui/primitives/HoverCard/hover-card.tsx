"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import * as React from "react";
import styles from "./hover-card.module.scss";

function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  );
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={`${styles.hoverCardContent} ${className || ""}`}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}

// Component implementation

export { HoverCard, HoverCardTrigger, HoverCardContent };
