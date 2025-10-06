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
  --background: var(--vscode-editor-background, oklch(0.145 0 0));
  --foreground: var(--vscode-editor-foreground, oklch(0.985 0 0));
  --card: var(--vscode-editorWidget-background, oklch(0.18 0 0));
  --card-foreground: var(--vscode-editorWidget-foreground, oklch(0.985 0 0));
  --popover: var(--vscode-editorWidget-background, oklch(0.18 0 0));
  --popover-foreground: var(--vscode-editorWidget-foreground, oklch(0.985 0 0));
  --primary: var(--vscode-button-background, oklch(0.488 0.243 264.376));
  --primary-foreground: var(--vscode-button-foreground, oklch(0.985 0 0));
  --secondary: var(--vscode-input-background, oklch(0.269 0 0));
  --secondary-foreground: var(--vscode-input-foreground, oklch(0.985 0 0));
  --muted: var(--vscode-descriptionForeground, oklch(0.708 0 0));
  --muted-foreground: var(--vscode-descriptionForeground, oklch(0.708 0 0));
  --accent: var(--vscode-list-hoverBackground, oklch(0.269 0 0));
  --accent-foreground: var(--vscode-list-hoverForeground, oklch(0.985 0 0));
  --destructive: var(--vscode-errorForeground, oklch(0.396 0.141 25.723));
  --destructive-foreground: var(--vscode-input-foreground, oklch(0.637 0.237 25.331));
  --border: var(--vscode-panel-border, oklch(0.269 0 0));
  --input: var(--vscode-input-border, oklch(0.269 0 0));
  --ring: var(--vscode-focusBorder, oklch(0.439 0 0));
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
