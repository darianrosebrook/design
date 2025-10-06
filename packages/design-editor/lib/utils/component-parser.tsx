/**
 * Component parser for ingesting components from design system packages
 * @author @darianrosebrook
 */

import React from "react";
import type { ComponentType } from "react";
import type { IngestedComponent } from "./dynamic-component-registry";

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  main?: string;
  exports?: Record<string, any>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface ComponentExport {
  name: string;
  component: ComponentType<any>;
  metadata?: {
    description?: string;
    category?: string;
    defaultProps?: Record<string, any>;
  };
}

export interface ParsedPackage {
  info: PackageInfo;
  components: ComponentExport[];
  errors: string[];
}

/**
 * Parse a design system package and extract components
 * Note: In a real implementation, this would use npm APIs or bundler analysis
 * For now, this simulates the parsing process
 */
export async function parseDesignSystemPackage(
  packageName: string
): Promise<ParsedPackage> {
  const errors: string[] = [];

  try {
    // Simulate package installation and analysis
    console.log(`Analyzing package: ${packageName}`);

    // Mock package info (in real implementation, this would come from npm registry)
    const packageInfo: PackageInfo = {
      name: packageName,
      version: "1.0.0",
      description: `Components from ${packageName}`,
      main: "dist/index.js",
      exports: {
        ".": "./dist/index.js",
        "./components": "./dist/components.js",
        "./primitives": "./dist/primitives.js",
      },
    };

    // Mock component discovery (in real implementation, this would analyze the package exports)
    const components = await discoverComponents(packageName, packageInfo);

    return {
      info: packageInfo,
      components,
      errors,
    };
  } catch (error) {
    errors.push(`Failed to parse package ${packageName}: ${error}`);
    return {
      info: { name: packageName, version: "unknown" },
      components: [],
      errors,
    };
  }
}

/**
 * Discover components from a package
 * This simulates analyzing package exports and extracting component metadata
 */
async function discoverComponents(
  packageName: string,
  packageInfo: PackageInfo
): Promise<ComponentExport[]> {
  const components: ComponentExport[] = [];

  try {
    // For demonstration, we'll create mock components based on common patterns
    // In a real implementation, this would dynamically import and analyze the package

    // Simulate different types of component libraries
    if (packageName.includes("ui") || packageName.includes("components")) {
      // Generic UI library
      components.push(
        ...createGenericUIComponents(packageName),
        ...createFormComponents(packageName),
        ...createLayoutComponents(packageName)
      );
    } else if (packageName.includes("design")) {
      // Design system
      components.push(...createDesignSystemComponents(packageName));
    } else if (packageName.includes("icons")) {
      // Icon library
      components.push(...createIconComponents(packageName));
    } else {
      // Generic components
      components.push(...createGenericComponents(packageName));
    }

    return components;
  } catch (error) {
    console.error(`Failed to discover components in ${packageName}:`, error);
    return [];
  }
}

/**
 * Create generic UI components
 */
function createGenericUIComponents(packageName: string): ComponentExport[] {
  const baseName = packageName.replace("@", "").replace("/", "-");

  return [
    {
      name: "GenericButton",
      component: React.forwardRef<
        HTMLButtonElement,
        React.ButtonHTMLAttributes<HTMLButtonElement>
      >((props, ref) => (
        <button
          ref={ref}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          {...props}
        />
      )),
      metadata: {
        description: "A generic button component",
        category: "Interactive",
        defaultProps: {
          children: "Button",
        },
      },
    },
    {
      name: "GenericCard",
      component: React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement>
      >(({ children, ...props }, ref) => (
        <div
          ref={ref}
          className="p-4 border border-gray-200 rounded-lg shadow-sm"
          {...props}
        >
          {children}
        </div>
      )),
      metadata: {
        description: "A generic card container",
        category: "Layout",
        defaultProps: {
          children: "Card Content",
        },
      },
    },
    {
      name: "GenericInput",
      component: React.forwardRef<
        HTMLInputElement,
        React.InputHTMLAttributes<HTMLInputElement>
      >((props, ref) => (
        <input
          ref={ref}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...props}
        />
      )),
      metadata: {
        description: "A generic input field",
        category: "Form",
        defaultProps: {
          placeholder: "Enter text...",
          type: "text",
        },
      },
    },
  ];
}

/**
 * Create form components
 */
function createFormComponents(packageName: string): ComponentExport[] {
  return [
    {
      name: "FormField",
      component: React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement> & { label?: string }
      >(({ label, children, ...props }, ref) => (
        <div ref={ref} className="space-y-2" {...props}>
          {label && (
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
          )}
          {children}
        </div>
      )),
      metadata: {
        description: "A form field wrapper with label",
        category: "Form",
        defaultProps: {
          label: "Field Label",
        },
      },
    },
    {
      name: "SelectField",
      component: React.forwardRef<
        HTMLSelectElement,
        React.SelectHTMLAttributes<HTMLSelectElement>
      >((props, ref) => (
        <select
          ref={ref}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...props}
        />
      )),
      metadata: {
        description: "A select dropdown component",
        category: "Form",
        defaultProps: {
          children: (
            <>
              <option value="">Select option...</option>
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
            </>
          ),
        },
      },
    },
  ];
}

/**
 * Create layout components
 */
function createLayoutComponents(packageName: string): ComponentExport[] {
  return [
    {
      name: "FlexContainer",
      component: React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement>
      >((props, ref) => (
        <div ref={ref} className="flex" {...props} />
      )),
      metadata: {
        description: "A flexible container component",
        category: "Layout",
        defaultProps: {},
      },
    },
    {
      name: "GridContainer",
      component: React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement>
      >((props, ref) => (
        <div ref={ref} className="grid grid-cols-3 gap-4" {...props} />
      )),
      metadata: {
        description: "A grid layout container",
        category: "Layout",
        defaultProps: {},
      },
    },
  ];
}

/**
 * Create design system specific components
 */
function createDesignSystemComponents(packageName: string): ComponentExport[] {
  return [
    {
      name: "DesignButton",
      component: React.forwardRef<
        HTMLButtonElement,
        React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }
      >(({ variant = "primary", ...props }, ref) => (
        <button
          ref={ref}
          className={`px-4 py-2 rounded font-medium ${
            variant === "primary"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          {...props}
        />
      )),
      metadata: {
        description: "A design system button with variants",
        category: "Interactive",
        defaultProps: {
          children: "Design Button",
          variant: "primary",
        },
      },
    },
    {
      name: "DesignCard",
      component: React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement> & { elevation?: number }
      >(({ elevation = 1, children, ...props }, ref) => (
        <div
          ref={ref}
          className={`p-6 rounded-lg bg-white ${
            elevation === 1
              ? "shadow-sm"
              : elevation === 2
              ? "shadow-md"
              : "shadow-lg"
          }`}
          {...props}
        >
          {children}
        </div>
      )),
      metadata: {
        description: "A design system card with elevation",
        category: "Layout",
        defaultProps: {
          children: "Card content",
          elevation: 1,
        },
      },
    },
  ];
}

/**
 * Create icon components
 */
function createIconComponents(packageName: string): ComponentExport[] {
  return [
    {
      name: "IconStar",
      component: React.forwardRef<
        SVGSVGElement,
        React.SVGProps<SVGSVGElement>
      >((props, ref) => (
        <svg
          ref={ref}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          {...props}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )),
      metadata: {
        description: "A star icon component",
        category: "Media",
        defaultProps: {},
      },
    },
    {
      name: "IconHeart",
      component: React.forwardRef<
        SVGSVGElement,
        React.SVGProps<SVGSVGElement>
      >((props, ref) => (
        <svg
          ref={ref}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          {...props}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )),
      metadata: {
        description: "A heart icon component",
        category: "Media",
        defaultProps: {},
      },
    },
  ];
}

/**
 * Create generic components for unknown packages
 */
function createGenericComponents(packageName: string): ComponentExport[] {
  return [
    {
      name: "GenericComponent",
      component: React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement>
      >((props, ref) => (
        <div ref={ref} className="p-4 bg-gray-100 rounded" {...props} />
      )),
      metadata: {
        description: "A generic component from the package",
        category: "Unknown",
        defaultProps: {
          children: "Generic Component",
        },
      },
    },
  ];
}

/**
 * Convert parsed components to ingested components
 */
export function convertToIngestedComponents(
  parsedPackage: ParsedPackage
): IngestedComponent[] {
  return parsedPackage.components.map((comp, index) => ({
    id: `${parsedPackage.info.name}-comp-${index}`,
    name: comp.name,
    description: comp.metadata?.description || `${comp.name} component`,
    category: comp.metadata?.category || "Unknown",
    icon: getIconForCategory(comp.metadata?.category || "Unknown"),
    defaultProps: comp.metadata?.defaultProps || {},
    component: comp.component,
    source: parsedPackage.info.name,
    version: parsedPackage.info.version,
    lastUpdated: new Date().toISOString(),
  }));
}

/**
 * Get appropriate icon for component category
 */
function getIconForCategory(category: string): string {
  const iconMap: Record<string, string> = {
    Interactive: "🔘",
    Layout: "📦",
    Form: "📝",
    Typography: "📄",
    Media: "🎨",
    Navigation: "🧭",
    Feedback: "💬",
    Data: "📊",
    Unknown: "❓",
  };

  return iconMap[category] || "❓";
}

/**
 * Validate package name
 */
export function validatePackageName(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (!name.trim()) {
    return { isValid: false, error: "Package name is required" };
  }

  // Basic npm package name validation
  const packageRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
  if (!packageRegex.test(name)) {
    return {
      isValid: false,
      error: "Package name can only contain letters, numbers, dots, hyphens, and underscores",
    };
  }

  // Check for scoped packages
  if (name.startsWith("@")) {
    const parts = name.split("/");
    if (parts.length !== 2) {
      return {
        isValid: false,
        error: "Scoped package names must be in format @scope/package",
      };
    }
  }

  return { isValid: true };
}
