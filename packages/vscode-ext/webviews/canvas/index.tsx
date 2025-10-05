// src/webviews/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./components/AppShell";
import { CanvasBridgeProvider } from "./lib/bridge-context";

// Import design system CSS
import "./styles/globals.css";
import "./styles/design-system.css";

function mount() {
  const root = document.getElementById("root");
  if (!root) {
    console.error("[webview] #root not found");
    return;
  }
  const r = createRoot(root);
  r.render(
    <CanvasBridgeProvider>
      <AppShell />
    </CanvasBridgeProvider>
  );
}

// VSCode theme CSS variables for theming integration
const vscodeThemeCss = `
/* CSS Variables for VSCode theming - overrides design system defaults */
:root {
  --background: var(--vscode-editor-background);
  --foreground: var(--vscode-editor-foreground);
  --card: var(--vscode-editorWidget-background);
  --card-foreground: var(--vscode-editorWidget-foreground);
  --popover: var(--vscode-editorWidget-background);
  --popover-foreground: var(--vscode-editorWidget-foreground);
  --primary: var(--vscode-button-background);
  --primary-foreground: var(--vscode-button-foreground);
  --secondary: var(--vscode-input-background);
  --secondary-foreground: var(--vscode-input-foreground);
  --muted: var(--vscode-descriptionForeground);
  --muted-foreground: var(--vscode-descriptionForeground);
  --accent: var(--vscode-list-hoverBackground);
  --accent-foreground: var(--vscode-list-hoverForeground);
  --destructive: var(--vscode-errorForeground);
  --destructive-foreground: var(--vscode-input-foreground);
  --border: var(--vscode-panel-border);
  --input: var(--vscode-input-border);
  --ring: var(--vscode-focusBorder);
}

/* Ensure VSCode font integration */
html, body, #root {
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
}
`;

const style = document.createElement("style");
style.textContent = vscodeThemeCss;
document.head.appendChild(style);

mount();
