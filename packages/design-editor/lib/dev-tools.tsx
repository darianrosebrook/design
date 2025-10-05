"use client";

import { useDevAPI } from "./dev-api";

/**
 * Component that exposes canvas API to window in development mode
 * Only renders in development to avoid SSR issues
 */
export function DevTools() {
  // This component only renders in development mode
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    return null;
  }

  // Call the dev API hook - this will expose the API to window
  useDevAPI();

  return null; // This component doesn't render anything visible
}
