/**
 * @fileoverview Multi-file ingestion system for design system components
 * @author @darianrosebrook
 *
 * Processes multiple component files uploaded from folders and ingests them into the design system
 */

import type { IngestedComponent } from "./dynamic-component-registry";
import { ingestComponent } from "./dynamic-component-registry";
import React from "react";

/**
 * Supported component file extensions
 */
const COMPONENT_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"] as const;

/**
 * Component metadata extraction result
 */
interface ComponentMetadata {
  name: string;
  description: string;
  category: string;
  defaultProps: Record<string, any>;
  propTypes?: Record<string, any>;
}

/**
 * Multi-file ingestion options
 */
export interface MultiFileIngestionOptions {
  files: FileList | File[];
  baseCategory?: string;
}

/**
 * Multi-file ingestion result
 */
export interface MultiFileIngestionResult {
  success: boolean;
  components: IngestedComponent[];
  errors: Array<{ file: string; error: string }>;
  totalFiles: number;
  processedFiles: number;
}

/**
 * Extract component name from exports in file content
 */
function extractComponentNameFromExports(
  fileContent: string,
  fileName: string
): string | null {
  try {
    // Look for named exports: export function ComponentName
    const namedExportMatch = fileContent.match(/export\s+function\s+(\w+)/);
    if (namedExportMatch) {
      return namedExportMatch[1];
    }

    // Look for named exports: export const ComponentName
    const constExportMatch = fileContent.match(/export\s+const\s+(\w+)\s*=/);
    if (constExportMatch) {
      return constExportMatch[1];
    }

    // Look for default exports: export default ComponentName
    const defaultExportMatch = fileContent.match(/export\s+default\s+(\w+)/);
    if (defaultExportMatch) {
      return defaultExportMatch[1];
    }

    // Look for default export function: export default function ComponentName
    const defaultFunctionMatch = fileContent.match(
      /export\s+default\s+function\s*(\w*)\s*\(/
    );
    if (defaultFunctionMatch && defaultFunctionMatch[1]) {
      return defaultFunctionMatch[1];
    }

    // Look for default export arrow function: export default () =>
    const defaultArrowMatch = fileContent.match(
      /export\s+default\s*\(\s*\)\s*=>/
    );
    if (defaultArrowMatch) {
      // Try to find a variable declaration above it
      const lines = fileContent.split("\n");
      const defaultArrowLine =
        fileContent.substring(0, defaultArrowMatch.index).split("\n").length -
        1;

      // Look backwards for const ComponentName =
      for (let i = defaultArrowLine - 1; i >= 0; i--) {
        const line = lines[i];
        const constMatch = line.match(/const\s+(\w+)\s*=\s*\(/);
        if (constMatch) {
          return constMatch[1];
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(
      `Error extracting component name from exports in ${fileName}:`,
      error
    );
    return null;
  }
}

/**
 * Extract component metadata from file content
 */
async function extractComponentMetadata(
  fileName: string,
  fileContent: string
): Promise<ComponentMetadata | null> {
  try {
    // First, try to extract component name from exports
    let componentName = extractComponentNameFromExports(fileContent, fileName);

    // Fallback to filename-based name if no export found
    if (!componentName) {
      componentName = fileName
        .replace(/\.(tsx|jsx|ts|js)$/, "")
        .split(/[-_\s]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
    }

    // Basic metadata extraction from file content
    let description = `Component from ${fileName}`;
    let category = "Custom";
    const defaultProps: Record<string, any> = {};

    // Look for JSDoc comments
    const jsdocMatch = fileContent.match(
      /\/\*\*\s*\n\s*\*\s*([^*\n]+).*?\*\//s
    );
    if (jsdocMatch) {
      description = jsdocMatch[1].trim();
    }

    // Look for category annotations
    const categoryMatch = fileContent.match(/@category\s+([^\n\r]+)/);
    if (categoryMatch) {
      category = categoryMatch[1].trim();
    }

    // Extract default props from file
    const defaultPropsMatch = fileContent.match(/defaultProps\s*=\s*({[^}]+})/);
    if (defaultPropsMatch) {
      try {
        const defaultPropsStr = defaultPropsMatch[1];
        // Simple JSON-like parsing (not full JS evaluation for security)
        const extractedProps = JSON.parse(
          defaultPropsStr.replace(/(\w+):/g, '"$1":')
        );
        Object.assign(defaultProps, extractedProps);
      } catch (e) {
        // Ignore invalid defaultProps
      }
    }

    // Look for interface or type definitions for props
    const interfaceMatch = fileContent.match(
      /interface\s+\w+Props\s*{([^}]+)}/
    );
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      // Extract prop names for basic prop types
      const propMatches = propsContent.matchAll(/(\w+):\s*([^;]+);/g);
      const propTypes: Record<string, any> = {};
      for (const match of propMatches) {
        const propName = match[1];
        const propType = match[2].trim();
        propTypes[propName] = propType;
      }
    }

    return {
      name: componentName,
      description,
      category,
      defaultProps,
    };
  } catch (error) {
    console.warn(`Failed to extract metadata from ${fileName}:`, error);
    return null;
  }
}

/**
 * Create a React component from file content
 */
async function createComponentFromFile(
  fileName: string,
  fileContent: string
): Promise<React.ComponentType<any> | null> {
  try {
    const componentName = fileName
      .replace(/\.(tsx|jsx|ts|js)$/, "")
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    // Create a placeholder component that indicates it was ingested from a file
    const IngestedComponent = React.forwardRef<any, any>((props, ref) => {
      const { children, ...restProps } = props;

      return React.createElement(
        "div",
        {
          ref,
          className:
            "ingested-component p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-md",
          "data-file": fileName,
          ...restProps,
        },
        React.createElement(
          "div",
          { className: "text-blue-700 font-medium mb-2" },
          `${componentName} (from ${fileName})`
        ),
        React.createElement(
          "div",
          { className: "text-blue-600 text-sm mb-2" },
          "Component ingested from file"
        ),
        React.createElement(
          "pre",
          {
            className:
              "text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32",
          },
          fileContent.slice(0, 200) + (fileContent.length > 200 ? "..." : "")
        ),
        children
      );
    });

    IngestedComponent.displayName = componentName;

    return IngestedComponent;
  } catch (error) {
    console.error(`Failed to create component from ${fileName}:`, error);
    return null;
  }
}

/**
 * Ingest components from multiple files
 */
export async function ingestComponentsFromFiles(
  options: MultiFileIngestionOptions
): Promise<MultiFileIngestionResult> {
  const { files, baseCategory = "Custom" } = options;

  const result: MultiFileIngestionResult = {
    success: false,
    components: [],
    errors: [],
    totalFiles: files.length,
    processedFiles: 0,
  };

  try {
    // Convert FileList to array if needed
    const fileArray = Array.from(files);

    console.log(`Processing ${fileArray.length} component files`);

    // Process each file
    for (const file of fileArray) {
      try {
        // Check file extension
        const isValidExtension = COMPONENT_EXTENSIONS.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (!isValidExtension) {
          result.errors.push({
            file: file.name,
            error: `Unsupported file extension. Supported: ${COMPONENT_EXTENSIONS.join(
              ", "
            )}`,
          });
          continue;
        }

        // Read file content
        const fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });

        // Extract metadata
        const metadata = await extractComponentMetadata(file.name, fileContent);
        if (!metadata) {
          result.errors.push({
            file: file.name,
            error: "Failed to extract component metadata",
          });
          continue;
        }

        // Create component
        const component = await createComponentFromFile(file.name, fileContent);
        if (!component) {
          result.errors.push({
            file: file.name,
            error: "Failed to create component",
          });
          continue;
        }

        // Create ingested component
        const ingestedComponent: IngestedComponent = {
          id: `file-${file.name}-${Date.now()}`.replace(/[^a-zA-Z0-9-_]/g, "-"),
          name: metadata.name,
          description: metadata.description,
          category: metadata.category || baseCategory,
          icon: "📄", // File icon to indicate it's from file upload
          defaultProps: metadata.defaultProps,
          component,
          source: file.name,
          version: "1.0.0",
          lastUpdated: new Date().toISOString(),
        };

        // Ingest the component
        const success = ingestComponent(ingestedComponent);
        if (success) {
          result.components.push(ingestedComponent);
          result.processedFiles++;
          console.log(`Ingested component: ${metadata.name} from ${file.name}`);
        } else {
          result.errors.push({
            file: file.name,
            error: "Failed to ingest component into registry",
          });
        }
      } catch (error) {
        result.errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    result.success = result.errors.length === 0 || result.processedFiles > 0;
    console.log(
      `File ingestion complete: ${result.processedFiles}/${result.totalFiles} components processed`
    );
  } catch (error) {
    result.errors.push({
      file: "general",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during file ingestion",
    });
  }

  return result;
}

/**
 * Get file ingestion status
 */
export interface FileIngestionStatus {
  isSupported: boolean;
  supportedExtensions: readonly string[];
  maxFileSize: number;
}

/**
 * Get file ingestion capabilities
 */
export function getFileIngestionStatus(): FileIngestionStatus {
  return {
    isSupported: true,
    supportedExtensions: COMPONENT_EXTENSIONS,
    maxFileSize: 1024 * 1024, // 1MB
  };
}
