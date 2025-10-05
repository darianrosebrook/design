"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
  return <>{children}</>;
}

function DropdownMenuTrigger({
  children,
  asChild,
  className,
  ...props
}: DropdownMenuTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return React.cloneElement(children as React.ReactElement, {
    className: cn(className, (children as React.ReactElement).props.className),
    ...props,
  });
}

function DropdownMenuContent({
  children,
  className,
  align = "start",
  side = "bottom",
}: DropdownMenuContentProps) {
  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      style={{
        top: side === "bottom" ? "100%" : "auto",
        bottom: side === "top" ? "100%" : "auto",
      }}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  children,
  className,
  onClick,
}: DropdownMenuItemProps) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn("h-px bg-border my-1", className)} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
