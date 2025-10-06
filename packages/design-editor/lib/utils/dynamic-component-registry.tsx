/**
 * Dynamic component registry for runtime component ingestion
 * @author @darianrosebrook
 */

import React from "react";
import type { ComponentType } from "react";
import {
  saveIngestedComponents,
  loadIngestedComponents,
  migrateStorageIfNeeded,
  clearStoredComponents,
} from "./library-storage";
import {
  parseDesignSystemPackage,
  convertToIngestedComponents,
} from "./component-parser";
import { getComponentCache } from "./component-cache";
import { getErrorRecoveryManager, ErrorCategory } from "./error-recovery";
import { getDesignSystemMonitor, ComponentOperation } from "./monitoring";
import {
  getDataIntegrityManager,
  createAutomaticBackup,
} from "./data-integrity";

// Core design system components that are always available
const CORE_COMPONENTS = {
  Button: () => import("@paths-design/design-system").then((m) => m.Button),
  Box: () => import("@paths-design/design-system").then((m) => m.Box),
  Input: () => import("@paths-design/design-system").then((m) => m.Input),
  Select: () => import("@paths-design/design-system").then((m) => m.Select),
  Checkbox: () => import("@paths-design/design-system").then((m) => m.Checkbox),
  Label: () => import("@paths-design/design-system").then((m) => m.Label),
  Icon: () => import("@paths-design/design-system").then((m) => m.Icon),
  Stack: () => import("@paths-design/design-system").then((m) => m.Stack),
  Flex: () => import("@paths-design/design-system").then((m) => m.Flex),
  Slider: () => import("@paths-design/design-system").then((m) => m.Slider),
  TextField: () =>
    import("@paths-design/design-system").then((m) => m.TextField),
  NumberField: () =>
    import("@paths-design/design-system").then((m) => m.NumberField),
  ColorField: () =>
    import("@paths-design/design-system").then((m) => m.ColorField),
  PropertiesPanel: () =>
    import("@paths-design/design-system").then((m) => m.PropertiesPanel),
  Tooltip: () => import("@paths-design/design-system").then((m) => m.Tooltip),
  Modal: () => import("@paths-design/design-system").then((m) => m.Modal),
  Popover: () => import("@paths-design/design-system").then((m) => m.Popover),
  ToggleButton: () =>
    import("@paths-design/design-system").then((m) => m.ToggleButton),
} as const;

export interface ComponentMetadata {
  name: string;
  description: string;
  category: string;
  icon: string;
  defaultProps: Record<string, any>;
  component: ComponentType<any>;
}

export interface IngestedComponent {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  defaultProps: Record<string, any>;
  component: ComponentType<any>;
  source: string; // e.g., "design-system", "user-upload", "npm-package"
  version?: string;
  lastUpdated: string;
}

// Global registry for dynamically loaded components
let DYNAMIC_REGISTRY: Map<string, IngestedComponent> = new Map();
let COMPONENT_CACHE_MANAGER: ReturnType<typeof getComponentCache>;

// Event system for registry updates
type RegistryListener = (components: Map<string, IngestedComponent>) => void;
const REGISTRY_LISTENERS: RegistryListener[] = [];

/**
 * Initialize the registry with core design system components and stored components
 */
export async function initializeRegistry(): Promise<void> {
  // Initialize cache manager
  COMPONENT_CACHE_MANAGER = getComponentCache();

  // Migrate storage if needed
  migrateStorageIfNeeded();

  // Load stored components first
  const storedComponents = loadIngestedComponents();

  // Load all core components
  for (const [name, importFn] of Object.entries(CORE_COMPONENTS)) {
    try {
      const Component = await importFn();
      COMPONENT_CACHE_MANAGER.cacheComponent(name.toLowerCase(), Component);

      const metadata = getCoreComponentMetadata(name);
      const ingestedComponent: IngestedComponent = {
        id: name.toLowerCase(),
        name,
        description: metadata.description,
        category: metadata.category,
        icon: metadata.icon,
        defaultProps: metadata.defaultProps,
        component: Component,
        source: "design-system",
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
      };

      DYNAMIC_REGISTRY.set(name.toLowerCase(), ingestedComponent);
    } catch (error) {
      console.warn(`Failed to load core component ${name}:`, error);
    }
  }

  // Add stored components (these will override core components if they have the same ID)
  storedComponents.forEach((component) => {
    DYNAMIC_REGISTRY.set(component.id, component);
    COMPONENT_CACHE_MANAGER.cacheComponent(
      component.id.toLowerCase(),
      component.component
    );
    COMPONENT_CACHE_MANAGER.cacheMetadata(
      component.id.toLowerCase(),
      component
    );
  });

  notifyListeners();
}

/**
 * Get component metadata for core components
 */
function getCoreComponentMetadata(
  componentName: string
): Omit<ComponentMetadata, "component"> {
  const metadataMap: Record<string, Omit<ComponentMetadata, "component">> = {
    Button: {
      name: "Button",
      description: "Interactive button component",
      category: "Interactive",
      icon: "🔘",
      defaultProps: {
        children: "Button",
        variant: "primary",
        size: "md",
      },
    },
    Box: {
      name: "Box",
      description: "Container component with styling options",
      category: "Layout",
      icon: "📦",
      defaultProps: {
        padding: "md",
        backgroundColor: "surface",
      },
    },
    Input: {
      name: "Input",
      description: "Text input field component",
      category: "Form",
      icon: "📝",
      defaultProps: {
        placeholder: "Enter text...",
        type: "text",
      },
    },
    Select: {
      name: "Select",
      description: "Dropdown selection component",
      category: "Form",
      icon: "▼",
      defaultProps: {
        placeholder: "Select option...",
        options: [],
      },
    },
    Checkbox: {
      name: "Checkbox",
      description: "Boolean selection component",
      category: "Form",
      icon: "☑️",
      defaultProps: {
        checked: false,
        label: "Checkbox",
      },
    },
    Label: {
      name: "Label",
      description: "Text label component",
      category: "Typography",
      icon: "🏷️",
      defaultProps: {
        children: "Label",
        size: "md",
      },
    },
    Icon: {
      name: "Icon",
      description: "Icon component for visual elements",
      category: "Media",
      icon: "🎨",
      defaultProps: {
        name: "star",
        size: "md",
      },
    },
    Stack: {
      name: "Stack",
      description: "Vertical layout container",
      category: "Layout",
      icon: "📚",
      defaultProps: {
        spacing: "md",
        direction: "vertical",
      },
    },
    Flex: {
      name: "Flex",
      description: "Flexible layout container",
      category: "Layout",
      icon: "🔧",
      defaultProps: {
        direction: "row",
        align: "center",
        justify: "start",
      },
    },
    Slider: {
      name: "Slider",
      description: "Numeric range input component",
      category: "Form",
      icon: "📊",
      defaultProps: {
        min: 0,
        max: 100,
        value: 50,
      },
    },
    TextField: {
      name: "TextField",
      description: "Enhanced text input with label and validation",
      category: "Form",
      icon: "📝",
      defaultProps: {
        label: "Text Field",
        placeholder: "Enter text...",
      },
    },
    NumberField: {
      name: "NumberField",
      description: "Numeric input field with validation",
      category: "Form",
      icon: "🔢",
      defaultProps: {
        label: "Number",
        min: 0,
        max: 100,
      },
    },
    ColorField: {
      name: "ColorField",
      description: "Color picker input component",
      category: "Form",
      icon: "🎨",
      defaultProps: {
        label: "Color",
        value: "#000000",
      },
    },
    PropertiesPanel: {
      name: "PropertiesPanel",
      description: "Component properties editing panel",
      category: "Interactive",
      icon: "⚙️",
      defaultProps: {
        title: "Properties",
        properties: [],
      },
    },
    Tooltip: {
      name: "Tooltip",
      description: "Hover tooltip component",
      category: "Interactive",
      icon: "💬",
      defaultProps: {
        content: "Tooltip content",
        children: "Hover me",
      },
    },
    Modal: {
      name: "Modal",
      description: "Modal dialog overlay",
      category: "Interactive",
      icon: "📋",
      defaultProps: {
        title: "Modal Title",
        children: "Modal content",
      },
    },
    Popover: {
      name: "Popover",
      description: "Positioned content overlay",
      category: "Interactive",
      icon: "📌",
      defaultProps: {
        content: "Popover content",
        children: "Click me",
      },
    },
    ToggleButton: {
      name: "ToggleButton",
      description: "Toggleable button component",
      category: "Interactive",
      icon: "🔄",
      defaultProps: {
        children: "Toggle",
        pressed: false,
      },
    },
  };

  return (
    metadataMap[componentName] || {
      name: componentName,
      description: "Component",
      category: "Unknown",
      icon: "❓",
      defaultProps: {},
    }
  );
}

/**
 * Get all available component names
 */
export function getAvailableComponents(): string[] {
  return Array.from(DYNAMIC_REGISTRY.keys());
}

/**
 * Get component metadata by name
 */
export function getComponentMetadata(
  componentName: string
): ComponentMetadata | null {
  const ingested = DYNAMIC_REGISTRY.get(componentName.toLowerCase());
  if (!ingested) return null;

  return {
    name: ingested.name,
    description: ingested.description,
    category: ingested.category,
    icon: ingested.icon,
    defaultProps: ingested.defaultProps,
    component: ingested.component,
  };
}

/**
 * Get component by name
 */
export function getComponent(componentName: string): ComponentType<any> | null {
  const monitor = getDesignSystemMonitor();
  const startTime = Date.now();

  try {
    // Try cache first for performance
    const cached = COMPONENT_CACHE_MANAGER.getComponent(
      componentName.toLowerCase()
    );
    if (cached) {
      monitor.recordComponentOperation(
        ComponentOperation.CACHE_HIT,
        componentName.toLowerCase(),
        Date.now() - startTime
      );
      return cached;
    }

    // Fall back to registry
    const ingested = DYNAMIC_REGISTRY.get(componentName.toLowerCase());
    if (ingested?.component) {
      // Cache for future use
      COMPONENT_CACHE_MANAGER.cacheComponent(
        componentName.toLowerCase(),
        ingested.component
      );
      monitor.recordComponentOperation(
        ComponentOperation.CACHE_MISS,
        componentName.toLowerCase(),
        Date.now() - startTime
      );
      return ingested.component;
    }

    monitor.recordComponentOperation(
      ComponentOperation.ERROR,
      componentName.toLowerCase(),
      Date.now() - startTime,
      {
        reason: "component_not_found",
      }
    );
    return null;
  } catch (error) {
    monitor.recordComponentOperation(
      ComponentOperation.ERROR,
      componentName.toLowerCase(),
      Date.now() - startTime,
      {
        reason: "component_retrieval_failed",
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return null;
  }
}

/**
 * Get all ingested components
 */
export function getAllIngestedComponents(): Map<string, IngestedComponent> {
  return new Map(DYNAMIC_REGISTRY);
}

/**
 * Get components by category
 */
export function getComponentsByCategory(category: string): IngestedComponent[] {
  return Array.from(DYNAMIC_REGISTRY.values()).filter(
    (component) => component.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Ingest a new component into the registry
 */
export function ingestComponent(component: IngestedComponent): boolean {
  const monitor = getDesignSystemMonitor();
  const startTime = Date.now();

  try {
    const id = component.id.toLowerCase();

    // Check if component already exists
    if (DYNAMIC_REGISTRY.has(id)) {
      console.warn(`Component "${component.name}" already exists in registry`);
      monitor.recordComponentOperation(
        ComponentOperation.ERROR,
        id,
        Date.now() - startTime,
        {
          reason: "component_already_exists",
        }
      );
      return false;
    }

    DYNAMIC_REGISTRY.set(id, component);
    COMPONENT_CACHE_MANAGER.cacheComponent(id, component.component);
    COMPONENT_CACHE_MANAGER.cacheMetadata(id, component);

    // Save to storage (only non-core components)
    if (component.source !== "design-system") {
      const nonCoreComponents = new Map(
        Array.from(DYNAMIC_REGISTRY.entries()).filter(
          ([, comp]) => comp.source !== "design-system"
        )
      );
      saveIngestedComponents(nonCoreComponents);

      // Create automatic backup after ingestion
      createAutomaticBackup(nonCoreComponents, "component_ingestion").catch(
        (error) => {
          console.warn("Failed to create automatic backup:", error);
        }
      );
    }

    notifyListeners();

    const duration = Date.now() - startTime;
    monitor.recordComponentOperation(ComponentOperation.INGEST, id, duration, {
      source: component.source,
      category: component.category,
    });

    // Periodic integrity check
    const integrityManager = getDataIntegrityManager();
    integrityManager
      .performPeriodicIntegrityCheck(DYNAMIC_REGISTRY)
      .catch((error) => {
        console.warn("Periodic integrity check failed:", error);
      });

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    monitor.recordComponentOperation(
      ComponentOperation.ERROR,
      component.id.toLowerCase(),
      duration,
      {
        reason: "ingestion_failed",
        error: error instanceof Error ? error.message : String(error),
      }
    );
    throw error;
  }
}

/**
 * Remove a component from the registry
 */
export function removeComponent(componentId: string): boolean {
  const id = componentId.toLowerCase();
  const existed = DYNAMIC_REGISTRY.delete(id);

  if (existed) {
    // Save updated components to storage
    const nonCoreComponents = new Map(
      Array.from(DYNAMIC_REGISTRY.entries()).filter(
        ([, comp]) => comp.source !== "design-system"
      )
    );
    saveIngestedComponents(nonCoreComponents);
    notifyListeners();
  }

  return existed;
}

/**
 * Update an existing component
 */
export function updateComponent(
  componentId: string,
  updates: Partial<IngestedComponent>
): boolean {
  const id = componentId.toLowerCase();
  const existing = DYNAMIC_REGISTRY.get(id);

  if (!existing) return false;

  const updated: IngestedComponent = {
    ...existing,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  DYNAMIC_REGISTRY.set(id, updated);
  COMPONENT_CACHE.set(updated.name, updated.component);

  // Save to storage (only non-core components)
  if (updated.source !== "design-system") {
    const nonCoreComponents = new Map(
      Array.from(DYNAMIC_REGISTRY.entries()).filter(
        ([, comp]) => comp.source !== "design-system"
      )
    );
    saveIngestedComponents(nonCoreComponents);
  }

  notifyListeners();
  return true;
}

/**
 * Clear all dynamically ingested components (keep core ones)
 */
export function clearIngestedComponents(): void {
  const coreComponents = Array.from(DYNAMIC_REGISTRY.values()).filter(
    (comp) => comp.source === "design-system"
  );

  DYNAMIC_REGISTRY.clear();

  // Re-add core components
  coreComponents.forEach((comp) => {
    DYNAMIC_REGISTRY.set(comp.id, comp);
  });

  // Clear storage
  clearStoredComponents();

  notifyListeners();
}

/**
 * Register a listener for registry changes
 */
export function addRegistryListener(listener: RegistryListener): () => void {
  REGISTRY_LISTENERS.push(listener);

  // Return unsubscribe function
  return () => {
    const index = REGISTRY_LISTENERS.indexOf(listener);
    if (index > -1) {
      REGISTRY_LISTENERS.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of registry changes
 */
function notifyListeners(): void {
  REGISTRY_LISTENERS.forEach((listener) => {
    try {
      listener(new Map(DYNAMIC_REGISTRY));
    } catch (error) {
      console.error("Error notifying registry listener:", error);
    }
  });
}

/**
 * Load components from a design system package
 * This is a simplified version - in a real implementation,
 * this would dynamically import from npm packages
 */
export async function loadFromDesignSystemPackage(
  packageName: string
): Promise<IngestedComponent[]> {
  const errorRecovery = getErrorRecoveryManager();

  try {
    // Parse the design system package
    const parsedPackage = await parseDesignSystemPackage(packageName);

    if (parsedPackage.errors.length > 0) {
      console.warn("Package parsing warnings:", parsedPackage.errors);
    }

    // Convert to ingested components with validation
    const { components: ingestedComponents, validationResults } =
      await convertToIngestedComponents(parsedPackage);

    // Log validation results
    if (validationResults.size > 0) {
      console.log(
        `Component validation completed for ${parsedPackage.info.name}:`
      );
      for (const [componentId, result] of validationResults) {
        if (result.error) {
          console.error(`  ${componentId}: Validation error - ${result.error}`);
        } else if (result.quickCheck && !result.quickCheck.isSafe) {
          console.warn(
            `  ${componentId}: Security issues - ${result.quickCheck.issues.join(
              ", "
            )}`
          );
        } else if (
          result.fullValidation &&
          result.fullValidation.severity !== "safe"
        ) {
          console.warn(
            `  ${componentId}: ${result.fullValidation.severity} severity issues (${result.fullValidation.issues.length} issues)`
          );
        } else {
          console.log(`  ${componentId}: Passed validation`);
        }
      }
    }

    // Ingest the components
    ingestedComponents.forEach((comp) => {
      ingestComponent(comp);
    });

    console.log(
      `Successfully loaded ${ingestedComponents.length} components from ${packageName}`
    );
    return ingestedComponents;
  } catch (error) {
    const recoveryResult = await errorRecovery.handleError(
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.LOADING,
      "component_ingestion",
      { packageName },
      `${packageName}-ingestion`
    );

    if (recoveryResult.success && recoveryResult.result) {
      // Recovery provided fallback components
      const fallbackComponents = Array.isArray(recoveryResult.result)
        ? recoveryResult.result
        : [recoveryResult.result];

      console.log(
        `Using fallback components due to ingestion failure: ${fallbackComponents.length} components`
      );
      return fallbackComponents;
    }

    // Fallback to mock components if recovery also fails
    console.error(
      `Failed to load components from ${packageName}, using basic fallback`
    );

    const fallbackComponents: IngestedComponent[] = [
      {
        id: `${packageName}-fallback-button`,
        name: "FallbackButton",
        description: `Button component from ${packageName} (fallback)`,
        category: "Interactive",
        icon: "🔘",
        defaultProps: {
          children: "Fallback Button",
        },
        component: React.forwardRef<HTMLButtonElement>((props, ref) => (
          <button
            ref={ref}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            {...props}
          />
        )),
        source: packageName,
        version: "unknown",
        lastUpdated: new Date().toISOString(),
      },
    ];

    fallbackComponents.forEach((comp) => {
      ingestComponent(comp);
    });

    return fallbackComponents;
  }
}

/**
 * Export registry data for persistence
 */
export function exportRegistry(): Record<string, IngestedComponent> {
  return Object.fromEntries(DYNAMIC_REGISTRY);
}

/**
 * Import registry data from persistence
 */
export function importRegistry(data: Record<string, IngestedComponent>): void {
  DYNAMIC_REGISTRY.clear();

  for (const [id, component] of Object.entries(data)) {
    DYNAMIC_REGISTRY.set(id, component);
  }

  notifyListeners();
}
