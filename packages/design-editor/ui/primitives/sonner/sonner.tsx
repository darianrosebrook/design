"use client";

import { useTheme } from "next-themes";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";
import styles from "./sonner.module.scss";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={`${styles.sonnerToaster} toaster group`}
      {...props}
    />
  );
};

// Component implementation

export { Toaster };
