/**
 * @fileoverview Component scanner for React components
 * @author @darianrosebrook
 */

import * as fs from "fs";
import * as path from "path";
import { ulid } from "ulidx";
import type {
  ComponentEntry,
  DiscoveryOptions,
  DiscoveryResult,
} from "./types.js";

/**
 * Component scanner using regex-based detection
 */
export class ComponentScanner {
  constructor() {}

  /**
   * Discover React components in a directory
   */
  async discover(options: DiscoveryOptions): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const components: ComponentEntry[] = [];
    const errors: Array<{ file: string; error: string }> = [];
    let filesScanned = 0;

    try {
      const files = this.findFiles(options.rootDir, options);

      for (const file of files) {
        filesScanned++;
        try {
          const fileComponents = await this.scanFile(file);
          components.push(...fileComponents);
        } catch (error) {
          console.error(`Error scanning ${file}:`, error);
          errors.push({
            file,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      console.error(`Exception in discover:`, error);
      errors.push({
        file: options.rootDir,
        error: `Failed to scan directory: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }

    const duration = Date.now() - startTime;

    return {
      components,
      errors,
      stats: {
        filesScanned,
        componentsFound: components.length,
        duration,
      },
    };
  }

  /**
   * Find files to scan
   */
  private findFiles(rootDir: string, options: DiscoveryOptions): string[] {
    const files: string[] = [];

    const scan = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir);
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // Skip common directories
            if (["node_modules", ".git", "dist", "build"].includes(entry)) {
              continue;
            }
            scan(fullPath);
          } else if (stat.isFile()) {
            const ext = path.extname(entry);
            if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
              // Check include patterns
              if (options.include && options.include.length > 0) {
                const relativePath = path.relative(rootDir, fullPath);
                const matchesAny = options.include.some((pattern) => {
                  // Convert glob pattern to regex
                  let regexPattern = pattern
                    .replace(/^\*\*\//, "(?:.*/)?") // **/ at start becomes optional .*/
                    .replace(/\*\*/g, ".*") // ** elsewhere matches any characters including /
                    .replace(/\*/g, "[^/]*") // * matches any characters except /
                    .replace(/\//g, "\\/"); // Escape forward slashes

                  // Simple directory matching: if pattern doesn't contain wildcards,
                  // match any path that starts with pattern/
                  if (!pattern.includes("*")) {
                    regexPattern = `^${pattern}/`;
                  } else {
                    regexPattern = `^${regexPattern}`;
                  }

                  const regex = new RegExp(regexPattern);
                  return regex.test(relativePath);
                });
                if (!matchesAny) {
                  continue;
                }
              }

              // Check exclude patterns
              if (options.exclude && options.exclude.length > 0) {
                const relativePath = path.relative(rootDir, fullPath);
                const shouldExclude = options.exclude.some((pattern) => {
                  // Convert glob pattern to regex
                  let regexPattern = pattern
                    .replace(/^\*\*\//, "(?:.*/)?") // **/ at start becomes optional .*/
                    .replace(/\*\*/g, ".*") // ** elsewhere matches any characters including /
                    .replace(/\*/g, "[^/]*") // * matches any characters except /
                    .replace(/\//g, "\\/"); // Escape forward slashes

                  // Simple directory matching: if pattern doesn't contain wildcards,
                  // match any path that starts with pattern/
                  if (!pattern.includes("*")) {
                    regexPattern = `^${pattern}/`;
                  } else {
                    regexPattern = `^${regexPattern}`;
                  }

                  const regex = new RegExp(regexPattern);
                  return regex.test(relativePath);
                });
                if (shouldExclude) {
                  continue;
                }
              }

              files.push(fullPath);
            }
          }
        }
      } catch (_error) {
        // Skip directories we can't read
      }
    };

    scan(rootDir);
    return files;
  }

  /**
   * Scan a single file for components
   */
  private async scanFile(filePath: string): Promise<ComponentEntry[]> {
    const components: ComponentEntry[] = [];

    try {
      const content = await fs.promises.readFile(filePath, "utf-8");

      // Find regular components
      const regularComponents = this.extractRegularComponents(
        content,
        filePath
      );
      components.push(...regularComponents);

      // Find compound components
      const compoundComponents = this.extractCompoundComponents(
        content,
        filePath
      );
      components.push(...compoundComponents);
    } catch (_error) {
      // Skip files we can't read
    }

    return components;
  }

  /**
   * Extract regular components using regex
   */
  private extractRegularComponents(
    content: string,
    filePath: string
  ): ComponentEntry[] {
    const components: ComponentEntry[] = [];

    // Match component declarations
    const patterns = [
      /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g,
      /export\s+(?:default\s+)?\{[^}]*\w+\s*:\s*(\w+)[^}]*\}/g,
      // Only match non-exported functions if they look like React components
      /(?:function|const|class)\s+(\w+)\s*(?:\(|=|\{)/g,
    ];

    for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
      const pattern = patterns[patternIndex];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const componentName = match[1];

        // Skip if this looks like a compound component (contains dots)
        if (componentName.includes(".")) {
          continue;
        }

        // For non-exported functions (pattern index 2), be more restrictive
        const isExported = patternIndex < 2; // First two patterns are for exports
        let shouldCheckComponent = true;

        if (!isExported) {
          // For non-exported functions, only check if they have strong React indicators
          const hasJSXUsage = new RegExp(
            `<${componentName}\\b|<${componentName}\\s|${componentName}\\s*=\\s*\\(`,
            "g"
          ).test(content);
          const hasReactUsage = new RegExp(
            `React\\.${componentName}\\b|${componentName}\\s*:\\s*React\\.`,
            "g"
          ).test(content);
          shouldCheckComponent = hasJSXUsage || hasReactUsage;
        }

        if (
          shouldCheckComponent &&
          this.isLikelyReactComponent(content, componentName)
        ) {
          const component = this.createComponentEntry(
            componentName,
            filePath,
            false
          );
          if (component && !components.find((c) => c.name === componentName)) {
            components.push(component);
          }
        }

        // Skip if we already found this component from an export pattern
        if (!isExported && components.find((c) => c.name === componentName)) {
          continue;
        }
      }
    }

    return components;
  }

  /**
   * Extract compound components using regex
   */
  private extractCompoundComponents(
    content: string,
    filePath: string
  ): ComponentEntry[] {
    const components: ComponentEntry[] = [];

    // Match compound component assignments like Component.SubComponent = ...
    // Covers: arrow functions (with/without params), function expressions, and variable references
    const compoundPattern =
      /(\w+)\.(\w+)\s*=\s*(?:\([^)]*\)\s*=>\s|function|\w+);?/g;

    let match;
    while ((match = compoundPattern.exec(content)) !== null) {
      const parentName = match[1];
      const subName = match[2];
      const compoundName = `${parentName}.${subName}`;
      // Check if the assignment looks like a React component
      if (this.isLikelyReactComponent(content, compoundName)) {
        const component = this.createComponentEntry(
          compoundName,
          filePath,
          true,
          parentName
        );
        if (component && !components.find((c) => c.name === compoundName)) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Check if text around a component name looks like a React component
   */
  private isLikelyReactComponent(
    content: string,
    componentName: string
  ): boolean {
    // For compound components, ensure the parent component exists
    if (componentName.includes(".")) {
      const parentName = componentName.split(".")[0];
      const parentExists =
        content.includes(`const ${parentName} =`) ||
        content.includes(`function ${parentName}`) ||
        content.includes(`export const ${parentName}`) ||
        content.includes(`export function ${parentName}`);
      if (!parentExists) {
        return false;
      }
      // For compound components, if parent exists, consider it valid
      return true;
    }

    // Check if the component name appears in JSX context
    // Look for patterns like <ComponentName or ComponentName( or ComponentName =
    const jsxPattern = new RegExp(
      `<${componentName}\\b|<${componentName}\\s|${componentName}\\s*=\\s*\\(|return\\s*<`,
      "g"
    );
    const hasJSXUsage = jsxPattern.test(content);

    // Also check for React patterns specifically with this component
    const reactPattern = new RegExp(
      `React\\.${componentName}\\b|${componentName}\\s*:\\s*React\\.`,
      "g"
    );
    const hasReactUsage = reactPattern.test(content);

    // For components that don't have their name in JSX, be very restrictive
    // Only allow this for exported functions, not helper functions
    const hasJSXInFile = content.includes("<") && content.includes(">");
    const isExportedFunction = new RegExp(
      `export\\s+(?:const|function)\\s+${componentName}\\s*[=(]`,
      "g"
    ).test(content);

    return hasJSXUsage || hasReactUsage || (hasJSXInFile && isExportedFunction);
  }

  /**
   * Create a component entry
   */
  private createComponentEntry(
    name: string,
    filePath: string,
    isCompound = false,
    parent?: string
  ): ComponentEntry | null {
    try {
      // Generate unique ID
      const id = ulid();

      // Extract props from the file content
      const props = this.extractProps(filePath, name);

      // Extract metadata from JSDoc comments
      const category = this.extractCategory(filePath, name);
      const tags = this.extractTags(filePath, name);
      const examples = this.extractExamples(filePath, name);
      const variants = this.extractVariants(filePath, name);

      return {
        id,
        name,
        modulePath: filePath,
        export: name,
        category,
        tags,
        examples,
        variants,
        props,
        isCompound,
        parent,
      };
    } catch (_error) {
      console.warn(`Failed to create component entry for ${name}:`, _error);
      return null;
    }
  }

  /**
   * Extract default values from function parameter destructuring
   */
  private extractDefaultValuesFromParameterDestructuring(
    content: string,
    componentName: string,
    props: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
      defaultValue?: any;
    }>
  ): void {
    // Look for parameter destructuring patterns like:
    // const Component = ({ prop = default, ... }: Props) => { ... }
    // function Component({ prop = default, ... }: Props) { ... }

    // Pattern for arrow function parameter destructuring
    const arrowParamPattern = new RegExp(
      `(?:const|let|var)\\s+${componentName}\\s*=\\s*\\(\\s*\\{\\s*([^}]+)\\}\\s*:\\s*[^)]*\\)\\s*=>`,
      "g"
    );

    let match;
    while ((match = arrowParamPattern.exec(content)) !== null) {
      const destructuring = match[1];
      this.parseDestructuringDefaults(destructuring, props);
    }

    // Reset regex for next use
    arrowParamPattern.lastIndex = 0;

    // Also check for function declarations with parameter destructuring
    const funcParamPattern = new RegExp(
      `(?:export\\s+)?function\\s+${componentName}\\s*\\(\\s*\\{\\s*([^}]+)\\}\\s*:\\s*[^}]*\\}\\s*\\)`,
      "g"
    );

    while ((match = funcParamPattern.exec(content)) !== null) {
      const destructuring = match[1];
      this.parseDestructuringDefaults(destructuring, props);
    }
  }

  /**
   * Split destructuring properties while respecting brackets and quotes
   */
  private splitDestructuringProps(destructuring: string): string[] {
    const props: string[] = [];
    let current = "";
    let braceDepth = 0;
    let bracketDepth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < destructuring.length; i++) {
      const char = destructuring[i];

      if (inString) {
        current += char;
        if (char === stringChar) {
          inString = false;
          stringChar = "";
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
          current += char;
        } else if (char === "{") {
          braceDepth++;
          current += char;
        } else if (char === "}") {
          braceDepth--;
          current += char;
        } else if (char === "[") {
          bracketDepth++;
          current += char;
        } else if (char === "]") {
          bracketDepth--;
          current += char;
        } else if (char === "," && braceDepth === 0 && bracketDepth === 0) {
          props.push(current);
          current = "";
        } else {
          current += char;
        }
      }
    }

    if (current.trim()) {
      props.push(current);
    }

    return props;
  }

  /**
   * Parse destructuring defaults from a destructuring string
   */
  private parseDestructuringDefaults(
    destructuring: string,
    props: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
      defaultValue?: any;
    }>
  ): void {
    // Split by commas but be careful about commas inside brackets/quotes
    const propsList = this.splitDestructuringProps(destructuring);

    for (const propStr of propsList) {
      const trimmed = propStr.trim();
      if (!trimmed) {
        continue;
      }

      // Simple pattern: prop = value
      const simpleMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (simpleMatch) {
        const [, propName, defaultValueStr] = simpleMatch;

        if (defaultValueStr) {
          // Skip complex expressions: function calls, ternary operators, property access, etc.
          const trimmedValue = defaultValueStr.trim();
          if (
            trimmedValue.includes("(") ||
            trimmedValue.includes(")") ||
            trimmedValue.includes("?") ||
            trimmedValue.includes(":") ||
            trimmedValue.includes(".") ||
            trimmedValue.includes("process.env") ||
            trimmedValue.includes("Math.")
          ) {
            // Skip complex expressions
            continue;
          }

          // Find the prop in our props array and add the default value (only if not already set)
          console.log(
            `Looking for prop: ${propName} in props:`,
            props.map((p) => p.name)
          );
          const prop = props.find((p) => p.name === propName);
          console.log(`Found prop:`, prop);
          if (prop && prop.defaultValue === undefined) {
            try {
              // Parse the default value (simple cases)
              if (
                trimmedValue.startsWith('"') ||
                trimmedValue.startsWith("'")
              ) {
                prop.defaultValue = trimmedValue.slice(1, -1);
              } else if (trimmedValue === "true") {
                prop.defaultValue = true;
              } else if (trimmedValue === "false") {
                prop.defaultValue = false;
              } else if (trimmedValue === "null") {
                prop.defaultValue = null;
              } else if (/^\d+$/.test(trimmedValue)) {
                prop.defaultValue = parseInt(trimmedValue, 10);
              } else if (/^\d+\.\d+$/.test(trimmedValue)) {
                prop.defaultValue = parseFloat(trimmedValue);
              } else if (
                trimmedValue.startsWith("{") ||
                trimmedValue.startsWith("[")
              ) {
                // For now, try to parse simple arrays like ["a", "b", "c"]
                if (
                  trimmedValue.startsWith("[") &&
                  trimmedValue.endsWith("]")
                ) {
                  try {
                    prop.defaultValue = JSON.parse(trimmedValue);
                  } catch (_error) {
                    prop.defaultValue = undefined;
                  }
                } else {
                  // Skip complex objects for now
                  prop.defaultValue = undefined;
                }
              } else {
                // Keep as string for other cases
                prop.defaultValue = trimmedValue;
              }
            } catch (_error) {
              // If parsing fails, skip setting default value
            }
          }
        }
      }
    }
  }

  /**
   * Extract category from JSDoc comments
   */
  private extractCategory(
    filePath: string,
    componentName: string
  ): string | undefined {
    try {
      const content = fs.readFileSync(filePath, "utf8");

      // Look for JSDoc comments above interfaces first, then functions
      // Check above interface first
      const interfaceDeclaration = content.indexOf(
        `interface ${componentName}Props`
      );

      let searchStart = -1;
      if (interfaceDeclaration !== -1) {
        // Look above the interface
        const beforeInterface = content.substring(0, interfaceDeclaration);
        const interfaceJsdocStart = beforeInterface.lastIndexOf("/**");
        if (interfaceJsdocStart !== -1) {
          searchStart = interfaceJsdocStart;
        }
      }

      // If no JSDoc above interface, check above function
      if (searchStart === -1) {
        // Find the function declaration
        let functionDeclaration = content.indexOf(
          `export function ${componentName}`
        );
        if (functionDeclaration === -1) {
          const tsPattern = new RegExp(
            `export function ${componentName}\\s*\\([^)]*\\)\\s*:\\s*[^\\{]*\\{`,
            "g"
          );
          const match = tsPattern.exec(content);
          if (match) {
            functionDeclaration = match.index;
          }
        }

        if (functionDeclaration !== -1) {
          const beforeFunction = content.substring(0, functionDeclaration);
          searchStart = beforeFunction.lastIndexOf("/**");
        }
      }

      if (searchStart === -1) {
        return undefined;
      }

      const lastJsdocStart = searchStart;
      if (lastJsdocStart === -1) {
        return undefined;
      }

      const lastJsdocEnd = content.indexOf("*/", lastJsdocStart);
      if (lastJsdocEnd === -1) {
        return undefined;
      }

      const jsdocContent = content.substring(lastJsdocStart + 3, lastJsdocEnd);
      const categoryMatch = jsdocContent.match(/\*?\s*@category\s+(\w+)/m);
      if (categoryMatch) {
        return categoryMatch[1];
      }

      return undefined;
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Extract tags from JSDoc comments
   */
  private extractTags(
    filePath: string,
    componentName: string
  ): string[] | undefined {
    try {
      const content = fs.readFileSync(filePath, "utf8");

      // Look for JSDoc comments above interfaces first, then functions
      // Check above interface first
      const interfaceDeclaration = content.indexOf(
        `interface ${componentName}Props`
      );

      let searchStart = -1;
      if (interfaceDeclaration !== -1) {
        // Look above the interface
        const beforeInterface = content.substring(0, interfaceDeclaration);
        const interfaceJsdocStart = beforeInterface.lastIndexOf("/**");
        if (interfaceJsdocStart !== -1) {
          searchStart = interfaceJsdocStart;
        }
      }

      // If no JSDoc above interface, check above function
      if (searchStart === -1) {
        // Find the function declaration
        let functionDeclaration = content.indexOf(
          `export function ${componentName}`
        );
        if (functionDeclaration === -1) {
          const tsPattern = new RegExp(
            `export function ${componentName}\\s*\\([^)]*\\)\\s*:\\s*[^\\{]*\\{`,
            "g"
          );
          const match = tsPattern.exec(content);
          if (match) {
            functionDeclaration = match.index;
          }
        }

        if (functionDeclaration !== -1) {
          const beforeFunction = content.substring(0, functionDeclaration);
          searchStart = beforeFunction.lastIndexOf("/**");
        }
      }

      if (searchStart === -1) {
        return undefined;
      }

      const lastJsdocStart = searchStart;
      if (lastJsdocStart === -1) {
        return undefined;
      }

      const lastJsdocEnd = content.indexOf("*/", lastJsdocStart);
      if (lastJsdocEnd === -1) {
        return undefined;
      }

      const jsdocContent = content.substring(lastJsdocStart + 3, lastJsdocEnd);
      const tagsMatch = jsdocContent.match(
        /\*?\s*@tags?\s+(.+?)(?=\s*\*?\s*@|\*\/|$)/m
      );
      if (tagsMatch) {
        return tagsMatch[1].split(",").map((tag) => tag.trim());
      }

      return undefined;
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Extract examples from JSDoc comments
   */
  private extractExamples(
    filePath: string,
    componentName: string
  ): string[] | undefined {
    try {
      const content = fs.readFileSync(filePath, "utf8");

      // Find the component declaration
      let componentDeclaration = content.indexOf(
        `export function ${componentName}`
      );
      // If not found, try with TypeScript syntax
      if (componentDeclaration === -1) {
        const tsPattern = new RegExp(
          `export function ${componentName}\\s*\\([^)]*\\)\\s*:\\s*[^\\{]*\\{`,
          "g"
        );
        const match = tsPattern.exec(content);
        if (match) {
          componentDeclaration = match.index;
        }
      }
      if (componentDeclaration === -1) {
        return undefined;
      }

      // Look for JSDoc comments above interfaces first, then functions
      // Check above interface first
      const interfaceDeclaration = content.indexOf(
        `interface ${componentName}Props`
      );

      let searchStart = -1;
      if (interfaceDeclaration !== -1) {
        // Look above the interface
        const beforeInterface = content.substring(0, interfaceDeclaration);
        const interfaceJsdocStart = beforeInterface.lastIndexOf("/**");
        if (interfaceJsdocStart !== -1) {
          searchStart = interfaceJsdocStart;
        }
      }

      // If no JSDoc above interface, check above function
      if (searchStart === -1) {
        const beforeFunction = content.substring(0, componentDeclaration);
        searchStart = beforeFunction.lastIndexOf("/**");
      }

      if (searchStart === -1) {
        return undefined;
      }

      const lastJsdocStart = searchStart;
      if (lastJsdocStart === -1) {
        return undefined;
      }

      const lastJsdocEnd = content.indexOf("*/", lastJsdocStart);
      if (lastJsdocEnd === -1) {
        return undefined;
      }

      const jsdocContent = content.substring(lastJsdocStart + 3, lastJsdocEnd);
      const exampleMatches = jsdocContent.match(
        /\*?\s*@example\s+(.+?)(?=\s*\*?\s*@|\*\/|$)/gm
      );
      if (exampleMatches) {
        return exampleMatches.map((match) => {
          // Extract the captured group (the content after @example)
          const exampleMatch = match.match(
            /\*?\s*@example\s+(.+?)(?=\s*\*?\s*@|\*\/|$)/
          );
          return exampleMatch
            ? exampleMatch[1].trim()
            : match.replace(/\*?\s*@example\s+/, "").trim();
        });
      }

      return undefined;
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Extract variants from JSDoc comments
   */
  private extractVariants(
    filePath: string,
    componentName: string
  ): Array<Record<string, unknown>> | undefined {
    try {
      const content = fs.readFileSync(filePath, "utf8");

      // Look for JSDoc comments above interfaces first, then functions
      // Check above interface first
      const interfaceDeclaration = content.indexOf(
        `interface ${componentName}Props`
      );

      let searchStart = -1;
      if (interfaceDeclaration !== -1) {
        // Look above the interface
        const beforeInterface = content.substring(0, interfaceDeclaration);
        const interfaceJsdocStart = beforeInterface.lastIndexOf("/**");
        if (interfaceJsdocStart !== -1) {
          searchStart = interfaceJsdocStart;
        }
      }

      // If no JSDoc above interface, check above function
      if (searchStart === -1) {
        // Find the function declaration
        let functionDeclaration = content.indexOf(
          `export function ${componentName}`
        );
        if (functionDeclaration === -1) {
          const tsPattern = new RegExp(
            `export function ${componentName}\\s*\\([^)]*\\)\\s*:\\s*[^\\{]*\\{`,
            "g"
          );
          const match = tsPattern.exec(content);
          if (match) {
            functionDeclaration = match.index;
          }
        }

        if (functionDeclaration !== -1) {
          const beforeFunction = content.substring(0, functionDeclaration);
          searchStart = beforeFunction.lastIndexOf("/**");
        }
      }

      if (searchStart === -1) {
        return undefined;
      }

      const lastJsdocStart = searchStart;
      if (lastJsdocStart === -1) {
        return undefined;
      }

      const lastJsdocEnd = content.indexOf("*/", lastJsdocStart);
      if (lastJsdocEnd === -1) {
        return undefined;
      }

      const jsdocContent = content.substring(lastJsdocStart + 3, lastJsdocEnd);
      const variantMatches = jsdocContent.match(
        /\*?\s*@variant\s+(.+?)(?=\s*\*?\s*@|\*\/|$)/gm
      );
      if (variantMatches) {
        const variants: Array<Record<string, unknown>> = [];
        for (const match of variantMatches) {
          // Extract the captured group (the content after @variant)
          const variantMatch = match.match(
            /\*?\s*@variant\s+(.+?)(?=\s*\*?\s*@|\*\/|$)/
          );
          const variantStr = variantMatch
            ? variantMatch[1].trim()
            : match.replace(/\*?\s*@variant\s+/, "").trim();

          // Check if it's a JSON array
          if (variantStr.startsWith("[") && variantStr.endsWith("]")) {
            try {
              const jsonVariants = JSON.parse(variantStr);
              if (Array.isArray(jsonVariants)) {
                variants.push(...jsonVariants);
                continue;
              }
            } catch {
              // Fall back to other parsing
            }
          }

          // Check if it's a comma-separated list of simple names
          if (variantStr.includes(",") && !variantStr.includes(":")) {
            // This is a list like "primary, secondary, danger" - split into separate variants
            const names = variantStr.split(",").map((name) => name.trim());
            for (const name of names) {
              variants.push({ name });
            }
          } else if (variantStr.includes(":")) {
            // Try to parse JSON-like format
            try {
              // Simple key-value parsing
              const pairs = variantStr.split(",").map((pair) => pair.trim());
              const variant: Record<string, unknown> = {};
              for (const pair of pairs) {
                const [key, ...valueParts] = pair.split(":");
                if (key && valueParts.length > 0) {
                  const value = valueParts.join(":").trim();
                  if (value === "true") {
                    variant[key.trim()] = true;
                  } else if (value === "false") {
                    variant[key.trim()] = false;
                  } else if (!isNaN(Number(value))) {
                    variant[key.trim()] = Number(value);
                  } else {
                    variant[key.trim()] = value.replace(/^["']|["']$/g, "");
                  }
                }
              }
              variants.push(variant);
            } catch {
              // Fall back to simple name-only
              variants.push({ name: variantStr });
            }
          } else {
            // Simple name
            variants.push({ name: variantStr });
          }
        }
        return variants;
      }

      return undefined;
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Extract default values from destructuring assignments in function bodies
   */
  private extractDefaultValuesFromDestructuring(
    content: string,
    componentName: string,
    props: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
      defaultValue?: any;
    }>
  ): void {
    // Look for destructuring patterns like:
    // const { prop = default, ... } = props;
    // ({ prop = default, ... }) => { ... }

    // Look for destructuring assignment in function bodies
    // Pattern: const { prop = default, ... } = props;
    const destructuringPattern = /const\s*\{\s*([^}]+)\}\s*=\s*props\s*;/g;
    let destructuringMatch;

    while ((destructuringMatch = destructuringPattern.exec(content)) !== null) {
      const destructuring = destructuringMatch[1];

      // Parse individual properties with defaults
      const propPattern = /(\w+)(?:\s*=\s*([^,}]+))?/g;
      let propMatch;

      while ((propMatch = propPattern.exec(destructuring)) !== null) {
        const [, propName, defaultValueStr] = propMatch;

        if (defaultValueStr) {
          // Skip complex expressions: function calls, ternary operators, property access, etc.
          const trimmedValue = defaultValueStr.trim();
          // For quoted strings, don't treat dots as complex expressions
          const isQuotedString =
            (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
            (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"));
          const hasComplexExpressions =
            trimmedValue.includes("(") ||
            trimmedValue.includes(")") ||
            trimmedValue.includes("?") ||
            trimmedValue.includes(":") ||
            (!isQuotedString && trimmedValue.includes(".")) ||
            trimmedValue.includes("process.env") ||
            trimmedValue.includes("Math.");

          if (hasComplexExpressions) {
            // Skip complex expressions
            continue;
          }

          // Find the prop in our props array and add the default value (only if not already set)
          const prop = props.find((p) => p.name === propName);
          if (prop && prop.defaultValue === undefined) {
            try {
              // Parse the default value (simple cases)
              if (
                trimmedValue.startsWith('"') ||
                trimmedValue.startsWith("'")
              ) {
                prop.defaultValue = trimmedValue.slice(1, -1);
              } else if (trimmedValue === "true") {
                prop.defaultValue = true;
              } else if (trimmedValue === "false") {
                prop.defaultValue = false;
              } else if (trimmedValue === "null") {
                prop.defaultValue = null;
              } else if (/^\d+$/.test(trimmedValue)) {
                prop.defaultValue = parseInt(trimmedValue, 10);
              } else if (/^\d+\.\d+$/.test(trimmedValue)) {
                prop.defaultValue = parseFloat(trimmedValue);
              } else if (
                trimmedValue.startsWith("{") ||
                trimmedValue.startsWith("[")
              ) {
                // Skip complex objects/arrays for now
                prop.defaultValue = undefined;
              } else {
                // Keep as string for other cases
                prop.defaultValue = trimmedValue;
              }
            } catch (_error) {
              // If parsing fails, skip setting default value
            }
          }
        }
      }
    }
  }

  /**
   * Extract default values from defaultProps assignments
   */
  private extractDefaultValuesFromDefaultProps(
    content: string,
    componentName: string,
    props: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
      defaultValue?: any;
    }>
  ): void {
    // Look for defaultProps assignments like:
    // ComponentName.defaultProps = { prop: value };

    const defaultPropsPattern = new RegExp(
      `${componentName}\\.defaultProps\\s*=\\s*\\{([^}]*)\\}`,
      "s"
    );

    const defaultPropsMatch = content.match(defaultPropsPattern);
    if (defaultPropsMatch) {
      const defaultPropsBody = defaultPropsMatch[1];

      // Parse individual default props
      const propPattern = /(\w+)\s*:\s*([^,}]+)/g;
      let propMatch;

      while ((propMatch = propPattern.exec(defaultPropsBody)) !== null) {
        const [, propName, defaultValueStr] = propMatch;

        // Find the prop in our props array and add the default value (only if not already set)
        const prop = props.find((p) => p.name === propName);
        if (prop && prop.defaultValue === undefined) {
          // Skip complex expressions: function calls, ternary operators, property access, etc.
          const trimmedValue = defaultValueStr.trim();
          if (
            trimmedValue.includes("(") ||
            trimmedValue.includes(")") ||
            trimmedValue.includes("?") ||
            trimmedValue.includes(":") ||
            trimmedValue.includes(".") ||
            trimmedValue.includes("process.env") ||
            trimmedValue.includes("Math.")
          ) {
            // Skip complex expressions
            continue;
          }

          try {
            // Parse the default value (simple cases)
            if (trimmedValue.startsWith('"') || trimmedValue.startsWith("'")) {
              prop.defaultValue = trimmedValue.slice(1, -1);
            } else if (trimmedValue === "true") {
              prop.defaultValue = true;
            } else if (trimmedValue === "false") {
              prop.defaultValue = false;
            } else if (trimmedValue === "null") {
              prop.defaultValue = null;
            } else if (/^\d+$/.test(trimmedValue)) {
              prop.defaultValue = parseInt(trimmedValue, 10);
            } else if (/^\d+\.\d+$/.test(trimmedValue)) {
              prop.defaultValue = parseFloat(trimmedValue);
            } else if (
              trimmedValue.startsWith("{") ||
              trimmedValue.startsWith("[")
            ) {
              // Skip complex objects/arrays for now
              prop.defaultValue = undefined;
            } else {
              // Keep as string for other cases
              prop.defaultValue = trimmedValue;
            }
          } catch (_error) {
            // If parsing fails, skip setting default value
          }
        }
      }
    }
  }

  /**
   * Extract props from component interface/type
   */
  private extractProps(
    filePath: string,
    componentName: string
  ): Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: any;
  }> {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const props: Array<{
        name: string;
        type: string;
        required: boolean;
        description?: string;
        defaultValue?: any;
      }> = [];

      // First, look for interface declarations like `interface ComponentNameProps`
      const interfacePattern = new RegExp(
        `interface\\s+${componentName}Props\\s*{([^}]*)}`,
        "s"
      );
      let interfaceMatch = content.match(interfacePattern);

      // If not found, try to find the interface name from the component's type annotation
      if (!interfaceMatch) {
        // Look for patterns like: const Component = ({ ... }: InterfaceName) => or function Component({ ... }: InterfaceName)
        const typeAnnotationPattern = new RegExp(
          `(?:const|let|var|function)\\s+${componentName}\\s*=\\s*\\(\\s*\\{[^}]*\\}\\s*:\\s*(\\w+)\\s*\\)`,
          "s"
        );
        const typeAnnotationMatch = content.match(typeAnnotationPattern);
        if (typeAnnotationMatch) {
          const interfaceName = typeAnnotationMatch[1];
          const altInterfacePattern = new RegExp(
            `interface\\s+${interfaceName}\\s*{([^}]*)}`,
            "s"
          );
          interfaceMatch = content.match(altInterfacePattern);
        }
      }

      if (interfaceMatch) {
        const interfaceBody = interfaceMatch[1];
        // Extract property declarations
        const propPattern =
          /^\s*(\w+)(\??)\s*:\s*([^;]+);(?:\s*\/\/\s*(.*))?$/gm;

        let propMatch;
        while ((propMatch = propPattern.exec(interfaceBody)) !== null) {
          const [, propName, optionalMarker, propType, description] = propMatch;
          props.push({
            name: propName,
            type: propType.trim(),
            required: optionalMarker !== "?",
            description: description?.trim(),
            defaultValue: undefined,
          });
        }
      }

      // Look for type declarations like `type ComponentNameProps = { ... }`
      const typePattern = new RegExp(
        `type\\s+${componentName}Props\\s*=\\s*{([^}]*)}`,
        "s"
      );
      const typeMatch = content.match(typePattern);

      if (typeMatch && props.length === 0) {
        const typeBody = typeMatch[1];
        // Extract property declarations
        const propPattern =
          /^\s*(\w+)(\??)\s*:\s*([^;]+);(?:\s*\/\/\s*(.*))?$/gm;

        let propMatch;
        while ((propMatch = propPattern.exec(typeBody)) !== null) {
          const [, propName, optionalMarker, propType, description] = propMatch;
          props.push({
            name: propName,
            type: propType.trim(),
            required: optionalMarker !== "?",
            description: description?.trim(),
            defaultValue: undefined,
          });
        }
      }

      // Look for inline type literals in function parameters
      if (props.length === 0) {
        // Pattern to match function declarations with inline type literals like:
        // export function Component(props: { title: string; children: React.ReactNode; }): JSX.Element
        const inlineTypePattern = new RegExp(
          `(?:export\\s+)?function\\s+${componentName}\\s*\\([^)]*:\\s*\\{([^}]*)\\}\\s*\\)`,
          "s"
        );
        const inlineTypeMatch = content.match(inlineTypePattern);
        if (inlineTypeMatch) {
          const inlineTypeBody = inlineTypeMatch[1];
          // Extract property declarations from inline type
          const propPattern =
            /^\s*(\w+)(\??)\s*:\s*([^;]+);(?:\s*\/\/\s*(.*))?$/gm;

          let propMatch;
          while ((propMatch = propPattern.exec(inlineTypeBody)) !== null) {
            const [, propName, optionalMarker, propType, description] =
              propMatch;
            props.push({
              name: propName,
              type: propType.trim(),
              required: optionalMarker !== "?",
              description: description?.trim(),
              defaultValue: undefined,
            });
          }
        }
      }

      // For compound components, extract props from the assignment
      if (componentName.includes(".")) {
        // Handle both arrow functions (Component.Sub = (...)) and function expressions (Component.Sub = function Name(...))
        const compoundPattern = new RegExp(
          `${componentName.replace(
            ".",
            "\\."
          )}\\s*=\\s*(?:function\\s+\\w+\\s*\\(|\\()([^)]*)\\)`,
          "s"
        );
        const compoundMatch = content.match(compoundPattern);
        if (compoundMatch) {
          const paramString = compoundMatch[1];
          // Parse the parameter destructuring like { title }: { title: string }
          // Look for patterns like { paramName }: { paramName: type }
          const fullPattern = /^\s*\{\s*([^}]+)\s*\}\s*:\s*\{\s*([^}]+)\s*\}/;
          const fullMatch = paramString.match(fullPattern);
          if (fullMatch) {
            const destructuring = fullMatch[1];
            const typeAnnotation = fullMatch[2];

            // Parse destructuring parameters: title, active = false, children
            const params = destructuring.split(",").map((p) => p.trim());

            for (const param of params) {
              // Handle patterns like: title, active = false
              const paramMatch = param.match(/(\w+)(?:\s*=\s*[^,]*)?/);
              if (paramMatch) {
                const paramName = paramMatch[1];

                // Extract type from type annotation like: title: string; label: string
                let paramType = "any";
                if (typeAnnotation) {
                  const typeMatch = typeAnnotation.match(
                    new RegExp(`${paramName}\\s*(?:\\??)\\s*:\\s*([^;]+)`)
                  );
                  if (typeMatch) {
                    paramType = typeMatch[1].trim();
                  }
                }

                const isOptional =
                  param.includes("?") ||
                  typeAnnotation?.includes(`${paramName}?:`) ||
                  param.includes("=");

                props.push({
                  name: paramName,
                  type: paramType,
                  required: !isOptional,
                  defaultValue: undefined,
                });
              }
            }
          } else {
            // Handle cases like { params }: InterfaceName
            const interfacePattern = /^\s*\{\s*([^}]+)\s*\}\s*:\s*(\w+)/;
            const interfaceMatch = paramString.match(interfacePattern);
            if (interfaceMatch) {
              const destructuring = interfaceMatch[1];
              const _interfaceName = interfaceMatch[2];

              // Parse destructuring parameters
              const params = destructuring.split(",").map((p) => p.trim());
              for (const param of params) {
                const paramMatch = param.match(/(\w+)(?:\s*=\s*[^,]*)?/);
                if (paramMatch) {
                  const paramName = paramMatch[1];
                  // For interface-based params, we can't easily extract types without AST parsing
                  // Just mark as any for now
                  props.push({
                    name: paramName,
                    type: "any",
                    required: !param.includes("="),
                    defaultValue: undefined,
                  });
                }
              }
            }
          }
        }
      }

      // Extract default values from parameter destructuring (highest precedence)
      this.extractDefaultValuesFromParameterDestructuring(
        content,
        componentName,
        props
      );

      // Extract default values from destructuring assignments in function bodies (higher precedence)
      this.extractDefaultValuesFromDestructuring(content, componentName, props);

      // Extract default values from defaultProps assignments (lower precedence - only if not already set)
      this.extractDefaultValuesFromDefaultProps(content, componentName, props);

      return props;
    } catch (_error) {
      return [];
    }
  }
}

/**
 * Legacy function for backwards compatibility
 */
export async function discoverComponents(
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const scanner = new ComponentScanner();
  return scanner.discover(options);
}
