/**
 * @fileoverview Component instance node renderer
 * @author @darianrosebrook
 *
 * Renders component instances by resolving them through the component index.
 * Components are reusable React components discovered from the codebase.
 */

import type { ComponentInstanceNodeType } from "@paths-design/canvas-schema";
import type { RendererOptions, RenderContext } from "../types.js";
import { RENDERER_CLASSES } from "../types.js";

/**
 * Render a component instance node to DOM
 *
 * Component instances reference React components discovered by the component indexer.
 * The renderer:
 * 1. Looks up the component in the provided component index
 * 2. Creates a placeholder representation (actual React rendering happens in webview)
 * 3. Displays component metadata and props
 * 4. Falls back to error placeholder if component not found
 *
 * @param node - Component instance node to render
 * @param options - Renderer configuration options
 * @param context - Render context with document and parent info
 * @returns HTMLElement representing the component instance
 */
export function renderComponent(
  node: ComponentInstanceNodeType,
  options: RendererOptions,
  _context: RenderContext
): HTMLElement {
  const element = document.createElement("div");

  // Set CSS classes
  element.classList.add(
    `${options.classPrefix ?? ""}${RENDERER_CLASSES.COMPONENT}`
  );

  // Apply visibility
  if (!node.visible) {
    element.style.display = "none";
  }

  // Apply base component styles
  element.style.boxSizing = "border-box";
  element.style.border = "1px dashed #9333ea"; // Purple dashed border for components
  element.style.backgroundColor = "rgba(147, 51, 234, 0.05)"; // Light purple tint
  element.style.position = "relative";

  // Try to resolve component from index
  const componentIndex = options.componentIndex;
  const component = componentIndex?.components.find(
    (c) => c.name === node.componentKey
  );

  if (component) {
    // Component found - render placeholder with metadata
    renderComponentPlaceholder(element, node, component);
  } else {
    // Component not found - render error placeholder
    renderComponentError(element, node);
  }

  // Apply opacity
  if (node.style?.opacity !== undefined && node.style.opacity !== 1) {
    element.style.opacity = node.style.opacity.toString();
  }

  return element;
}

/**
 * Render component placeholder with metadata
 */
function renderComponentPlaceholder(
  element: HTMLElement,
  node: ComponentInstanceNodeType,
  component: any
): void {
  // Create header with component name
  const header = document.createElement("div");
  header.style.padding = "8px 12px";
  header.style.backgroundColor = "rgba(147, 51, 234, 0.1)";
  header.style.borderBottom = "1px dashed #9333ea";
  header.style.fontFamily = "system-ui, -apple-system, sans-serif";
  header.style.fontSize = "12px";
  header.style.fontWeight = "600";
  header.style.color = "#7c3aed";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "6px";

  // Component icon
  const icon = document.createElement("span");
  icon.textContent = "⚛️";
  icon.style.fontSize = "14px";
  header.appendChild(icon);

  // Component name
  const name = document.createElement("span");
  name.textContent = node.componentKey;
  header.appendChild(name);

  element.appendChild(header);

  // Create content area with props
  const content = document.createElement("div");
  content.style.padding = "12px";
  content.style.fontFamily = "system-ui, -apple-system, sans-serif";
  content.style.fontSize = "11px";
  content.style.color = "#64748b";

  // Show prop count
  const propCount = Object.keys(node.props ?? {}).length;
  if (propCount > 0) {
    const propInfo = document.createElement("div");
    propInfo.style.marginBottom = "8px";
    propInfo.textContent = `${propCount} prop${
      propCount !== 1 ? "s" : ""
    } configured`;
    content.appendChild(propInfo);

    // Show prop list
    const propList = document.createElement("div");
    propList.style.display = "flex";
    propList.style.flexDirection = "column";
    propList.style.gap = "4px";

    for (const [key, value] of Object.entries(node.props ?? {})) {
      const propItem = document.createElement("div");
      propItem.style.display = "flex";
      propItem.style.gap = "8px";

      const propKey = document.createElement("span");
      propKey.style.fontWeight = "500";
      propKey.style.color = "#475569";
      propKey.textContent = key + ":";

      const propValue = document.createElement("span");
      propValue.style.color = "#64748b";
      propValue.textContent = truncateValue(value);

      propItem.appendChild(propKey);
      propItem.appendChild(propValue);
      propList.appendChild(propItem);
    }

    content.appendChild(propList);
  } else {
    const noProps = document.createElement("div");
    noProps.style.fontStyle = "italic";
    noProps.textContent = "No props configured";
    content.appendChild(noProps);
  }

  // Show component metadata if available
  if (component.description) {
    const description = document.createElement("div");
    description.style.marginTop = "12px";
    description.style.paddingTop = "12px";
    description.style.borderTop = "1px solid rgba(147, 51, 234, 0.1)";
    description.style.fontSize = "10px";
    description.style.color = "#94a3b8";
    description.style.lineHeight = "1.4";
    description.textContent = component.description;
    content.appendChild(description);
  }

  element.appendChild(content);

  // Add data attribute for testing
  element.dataset.componentKey = node.componentKey;
}

/**
 * Render error placeholder when component not found
 */
function renderComponentError(
  element: HTMLElement,
  node: ComponentInstanceNodeType
): void {
  element.style.border = "1px dashed #ef4444"; // Red dashed border for errors
  element.style.backgroundColor = "rgba(239, 68, 68, 0.05)"; // Light red tint

  // Create error header
  const header = document.createElement("div");
  header.style.padding = "8px 12px";
  header.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
  header.style.borderBottom = "1px dashed #ef4444";
  header.style.fontFamily = "system-ui, -apple-system, sans-serif";
  header.style.fontSize = "12px";
  header.style.fontWeight = "600";
  header.style.color = "#dc2626";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "6px";

  // Error icon
  const icon = document.createElement("span");
  icon.textContent = "⚠️";
  icon.style.fontSize = "14px";
  header.appendChild(icon);

  // Error message
  const message = document.createElement("span");
  message.textContent = "Component Not Found";
  header.appendChild(message);

  element.appendChild(header);

  // Create error content
  const content = document.createElement("div");
  content.style.padding = "12px";
  content.style.fontFamily = "system-ui, -apple-system, sans-serif";
  content.style.fontSize = "11px";
  content.style.color = "#64748b";

  const errorText = document.createElement("div");
  errorText.innerHTML = `
    <div style="margin-bottom: 8px;">
      Component key: <code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 2px; font-family: monospace;">${node.componentKey}</code>
    </div>
    <div style="font-size: 10px; color: #94a3b8;">
      This component was not found in the component index. Make sure the component exists and the index is up to date.
    </div>
  `;

  content.appendChild(errorText);
  element.appendChild(content);

  // Add data attribute for testing
  element.dataset.componentKey = node.componentKey;
  element.dataset.componentError = "not-found";
}

/**
 * Truncate value for display
 */
function truncateValue(value: unknown, maxLength: number = 30): string {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (str.length <= maxLength) {return str;}
  return str.substring(0, maxLength - 3) + "...";
}
