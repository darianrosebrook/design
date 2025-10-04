/**
 * @fileoverview React bundle for webviews
 * @author @darianrosebrook
 *
 * This file bundles React and ReactDOM into a single global bundle
 * to prevent multiple React instances across webviews.
 */

import React from "react";
import { createRoot } from "react-dom/client";

// Make React available globally immediately
const globalWindow = window as any;

// Set up React globally before any other modules load
Object.defineProperty(globalWindow, "React", {
  value: React,
  writable: false,
  configurable: false,
});

Object.defineProperty(globalWindow, "ReactDOM", {
  value: { createRoot },
  writable: false,
  configurable: false,
});

// Override any existing require function or create one
const originalRequire = globalWindow.require;
globalWindow.require = function (id: string) {
  // If it's React or ReactDOM, return the global object
  if (id === "react" || id === "react-dom" || id === "react-dom/client") {
    if (id === "react" || id === "react-dom") {return React;}
    if (id === "react-dom/client") {return { createRoot };}
  }

  // Handle React JSX runtime
  if (id === "react/jsx-runtime") {
    return {
      jsx: React.createElement,
      jsxs: React.createElement,
      Fragment: React.Fragment,
    };
  }

  // Handle React JSX dev runtime
  if (id === "react/jsx-dev-runtime") {
    return {
      jsxDEV: React.createElement,
      Fragment: React.Fragment,
    };
  }

  // Handle other React modules that might be required
  if (id.startsWith("react/")) {
    // For other react/* modules, return empty object or throw error
    throw new Error(`React module "${id}" is not supported in webview context`);
  }

  // Otherwise, use the original require if it exists
  if (originalRequire) {
    return originalRequire.call(this, id);
  }

  // If no original require, throw an error for unsupported modules
  throw new Error(`Dynamic require of "${id}" is not supported`);
};

// Also set up module.exports for compatibility
if (typeof globalWindow.module === "undefined") {
  globalWindow.module = {};
}
if (typeof globalWindow.exports === "undefined") {
  globalWindow.exports = {};
}
