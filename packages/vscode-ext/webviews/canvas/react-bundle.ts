/**
 * @fileoverview React bundle for webviews
 * @author @darianrosebrook
 *
 * This file bundles React and ReactDOM into a single global bundle
 * to prevent multiple React instances across webviews.
 */

import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

console.log("[react-bundle] start");

// Make React available globally immediately
const globalWindow = window as any;

console.info("[react-bundle] React imports loaded:", {
  React: !!React,
  ReactDOM: !!ReactDOM,
  createRoot: !!createRoot,
});

// Set up React globally before any other modules load
try {
  // Use direct assignment first, then Object.defineProperty as backup
  globalWindow.React = React;
  globalWindow.ReactDOM = ReactDOM;
  globalWindow.ReactDOMClient = { createRoot };

  // Also set using Object.defineProperty for additional protection
  Object.defineProperty(globalWindow, "React", {
    value: React,
    writable: false,
    configurable: false,
  });

  Object.defineProperty(globalWindow, "ReactDOM", {
    value: ReactDOM,
    writable: false,
    configurable: false,
  });

  Object.defineProperty(globalWindow, "ReactDOMClient", {
    value: { createRoot },
    writable: false,
    configurable: false,
  });

  console.log("[react-bundle] React globals set:", {
    React: !!globalWindow.React,
    ReactDOM: !!globalWindow.ReactDOM,
    ReactDOMClient: !!globalWindow.ReactDOMClient,
    ReactDOMClientCreateRoot: !!globalWindow.ReactDOMClient?.createRoot,
    ReactDOMRender: !!globalWindow.ReactDOM?.render,
  });

  console.info("[react-bundle] ready - globals available for canvas.js");
} catch (error) {
  console.error("[react-bundle] Failed to set React globals:", error);
}

// Override any existing require function or create one
const originalRequire = globalWindow.require;
globalWindow.require = function (id: string) {
  // If it's React or ReactDOM, return the global object
  if (id === "react" || id === "react-dom" || id === "react-dom/client") {
    if (id === "react") {
      return React;
    }
    if (id === "react-dom") {
      return ReactDOM;
    }
    if (id === "react-dom/client") {
      return { createRoot };
    }
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
