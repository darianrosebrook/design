/**
 * @fileoverview TypeScript Compiler API-based component scanner
 * @author @darianrosebrook
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import { ulid } from "ulidx";
import type {
  DiscoveryOptions,
  DiscoveryResult,
  ComponentEntry,
  ComponentProp,
  RawComponentMetadata,
} from "./types.js";

/**
 * Component scanner using TypeScript Compiler API
 */
export class ComponentScanner {
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;

  /**
   * Discover React components in a TypeScript project
   */
  async discover(options: DiscoveryOptions): Promise<DiscoveryResult> {
    console.log("=== DISCOVER METHOD CALLED ===");
    console.log("Options:", options);
    console.log("Root dir exists:", fs.existsSync(options.rootDir));
    const startTime = Date.now();
    const components: ComponentEntry[] = [];
    const errors: Array<{ file: string; error: string }> = [];
    let filesScanned = 0;

    try {
      // Load tsconfig or create default config
      const configPath =
        options.tsconfigPath ?? path.join(options.rootDir, "tsconfig.json");
      const configFile = this.loadTsConfig(configPath, options.rootDir);

      // Check if this is a temp directory scan
      const rootDir = options.rootDir;
      const isTempDir =
        rootDir.includes("tmp") ||
        rootDir.includes("temp") ||
        rootDir.includes("defaults-test") ||
        rootDir.startsWith("/var/folders");

      console.log(`Root dir: ${rootDir}`);
      console.log(`Is temp dir: ${isTempDir}`);

      if (isTempDir) {
        console.log(`Detected temp directory scan: ${rootDir}`);
        // For temp directories, create a minimal program with no files
        // We'll handle the scanning differently
        this.program = ts.createProgram([], configFile.options);
        this.checker = this.program.getTypeChecker();
      } else {
        // Filter out temp files from the file list
        const filteredFileNames = configFile.fileNames.filter((fileName) => {
          const shouldInclude = !(
            fileName.includes("tmp") ||
            fileName.includes("temp") ||
            fileName.includes("defaults-test") ||
            (fileName.startsWith("/var/folders") &&
              fileName.includes("defaults-test"))
          );
          if (!shouldInclude) {
            console.log(`Excluding temp file from program: ${fileName}`);
          }
          return shouldInclude;
        });

        console.log(
          `Filtered file names from ${configFile.fileNames.length} to ${filteredFileNames.length}`
        );

        // Create TypeScript program with filtered files
        this.program = ts.createProgram(filteredFileNames, configFile.options);
        this.checker = this.program.getTypeChecker();
      }

      // Scan each source file
      console.log(
        `Program contains ${this.program.getSourceFiles().length} source files`
      );

      if (isTempDir) {
        // For temp directories, manually scan the temp files
        console.log(`Scanning temp directory: ${options.rootDir}`);
        const tempFiles = this.findTypeScriptFiles(options.rootDir);
        console.log(`Found ${tempFiles.length} temp files to scan`);

        for (const tempFile of tempFiles) {
          try {
            console.log(`Reading temp file: ${tempFile}`);
            const fileContent = fs.readFileSync(tempFile, "utf8");

            // Create a source file object manually
            const sourceFile = ts.createSourceFile(
              tempFile,
              fileContent,
              ts.ScriptTarget.ES2022,
              true
            );

            const fileComponents = this.scanFile(sourceFile);
            console.log(
              `Scanned temp file ${tempFile}, found ${fileComponents.length} components`
            );
            components.push(...fileComponents);
            filesScanned++;
          } catch (error: unknown) {
            console.error(`Error scanning temp file ${tempFile}:`, error);
            errors.push({
              file: tempFile,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } else {
        // Normal scanning for production directories
        for (const sourceFile of this.program.getSourceFiles()) {
          console.log(`Source file: ${sourceFile.fileName}`);
          if (this.shouldScanFile(sourceFile, options)) {
            filesScanned++;
            try {
              console.log(`About to scan file: ${sourceFile.fileName}`);
              console.log(`File exists: ${fs.existsSync(sourceFile.fileName)}`);
              const fileComponents = this.scanFile(sourceFile);
              console.log(
                `Scanned file ${sourceFile.fileName}, found ${fileComponents.length} components`
              );
              components.push(...fileComponents);
            } catch (error: unknown) {
              console.error(
                `Error scanning file ${sourceFile.fileName}:`,
                error
              );
              console.error(
                `Error stack:`,
                error instanceof Error ? error.stack : "No stack"
              );
              errors.push({
                file: sourceFile.fileName,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      }
    } catch (error) {
      errors.push({
        file: options.rootDir,
        error: `Failed to initialize scanner: ${
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
   * Load TypeScript configuration
   */
  private loadTsConfig(
    configPath: string,
    rootDir: string
  ): ts.ParsedCommandLine {
    if (fs.existsSync(configPath)) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      return ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );
    }

    // Default configuration
    return {
      options: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true,
      },
      fileNames: this.findTypeScriptFiles(rootDir),
      errors: [],
    };
  }

  /**
   * Find TypeScript files in directory
   */
  private findTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];

    // Skip temp directories entirely
    if (
      dir.includes("tmp") ||
      dir.includes("temp") ||
      dir.includes("defaults-test")
    ) {
      console.log(`Skipping temp directory: ${dir}`);
      return files;
    }

    // Also skip directories that start with /var/folders (macOS temp dirs)
    if (dir.startsWith("/var/folders") && dir.includes("defaults-test")) {
      console.log(`Skipping macOS temp directory: ${dir}`);
      return files;
    }

    const scan = (currentDir: string) => {
      if (!fs.existsSync(currentDir)) {
        return;
      }

      // Skip temp subdirectories
      if (
        currentDir.includes("tmp") ||
        currentDir.includes("temp") ||
        currentDir.includes("defaults-test")
      ) {
        return;
      }

      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
            scan(fullPath);
          }
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
        ) {
          files.push(fullPath);
        }
      }
    };

    scan(dir);
    return files;
  }

  /**
   * Check if file should be scanned
   */
  private shouldScanFile(
    sourceFile: ts.SourceFile,
    options: DiscoveryOptions
  ): boolean {
    const filePath = sourceFile.fileName;
    console.log(`Checking if should scan file: ${filePath}`);

    // Skip temp files for now to avoid AST issues
    if (
      filePath.includes("tmp") ||
      filePath.includes("temp") ||
      filePath.includes("defaults-test") ||
      (filePath.startsWith("/var/folders") &&
        filePath.includes("defaults-test"))
    ) {
      console.log(`Skipping temp file: ${filePath}`);
      return false;
    }

    // Skip declaration files
    if (filePath.endsWith(".d.ts")) {
      console.log(`Skipping .d.ts file: ${filePath}`);
      return false;
    }

    // Skip node_modules
    if (filePath.includes("node_modules")) {
      console.log(`Skipping node_modules file: ${filePath}`);
      return false;
    }

    // Check includes
    if (options.include && options.include.length > 0) {
      const included = options.include.some((pattern) =>
        filePath.includes(pattern)
      );
      if (!included) {
        console.log(`File not included by pattern: ${filePath}`);
        return false;
      }
    }

    // Check excludes
    if (options.exclude && options.exclude.length > 0) {
      const excluded = options.exclude.some((pattern) =>
        filePath.includes(pattern)
      );
      if (excluded) {
        console.log(`File excluded by pattern: ${filePath}`);
        return false;
      }
    }

    console.log(`Will scan file: ${filePath}`);
    return true;
  }

  /**
   * Scan a single TypeScript file for React components
   */
  private scanFile(sourceFile: ts.SourceFile): ComponentEntry[] {
    const components: ComponentEntry[] = [];

    try {
      // Use simple string-based detection for all files to avoid AST issues
      const fileText = sourceFile.getText();

      // Simple regex to find exported function components
      const exportFunctionRegex = /export\s+function\s+(\w+)\s*\(/g;
      let match;

      console.log(
        `Scanning file: ${sourceFile.fileName}, length: ${fileText.length}`
      );
      console.log(`File content preview: ${fileText.substring(0, 200)}`);

      while ((match = exportFunctionRegex.exec(fileText)) !== null) {
        console.log(`Found function match: ${match[0]}, name: ${match[1]}`);
        const componentName = match[1];

        // Check if the function has JSX (contains < and > or </>)
        const functionStart = match.index;
        const functionBodyStart = fileText.indexOf("{", functionStart);
        if (functionBodyStart === -1) continue;

        // Find the matching closing brace (simplified - doesn't handle nested braces)
        let braceCount = 0;
        let functionEnd = functionBodyStart;
        for (let i = functionBodyStart; i < fileText.length; i++) {
          if (fileText[i] === "{") braceCount++;
          else if (fileText[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              functionEnd = i;
              break;
            }
          }
        }

        const functionBody = fileText.substring(
          functionBodyStart,
          functionEnd + 1
        );
        if (
          functionBody.includes("<") &&
          (functionBody.includes(">") || functionBody.includes("/>"))
        ) {
          // This looks like a React component
          const metadata: RawComponentMetadata = {
            name: componentName,
            filePath: sourceFile.fileName,
            exportName: componentName,
            props: [], // We'll extract these later if needed
          };

          components.push(this.createComponentEntry(metadata));
        }
      }

      // Also check for arrow function components: export const Component = () => ...
      const exportArrowRegex = /export\s+const\s+(\w+)\s*=\s*\(/g;
      while ((match = exportArrowRegex.exec(fileText)) !== null) {
        const componentName = match[1];

        // Find the arrow function body
        const arrowIndex = fileText.indexOf("=>", match.index);
        if (arrowIndex === -1) continue;

        let bodyStart = arrowIndex + 2;
        // Skip whitespace
        while (bodyStart < fileText.length && /\s/.test(fileText[bodyStart]))
          bodyStart++;

        let functionBody = "";
        if (fileText[bodyStart] === "{") {
          // Block body - find matching brace
          let braceCount = 0;
          let bodyEnd = bodyStart;
          for (let i = bodyStart; i < fileText.length; i++) {
            if (fileText[i] === "{") braceCount++;
            else if (fileText[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                bodyEnd = i;
                break;
              }
            }
          }
          functionBody = fileText.substring(bodyStart, bodyEnd + 1);
        } else {
          // Expression body - find end of expression (simplified)
          const semicolonIndex = fileText.indexOf(";", bodyStart);
          const commaIndex = fileText.indexOf(",", bodyStart);
          const endIndex = Math.min(
            semicolonIndex !== -1 ? semicolonIndex : fileText.length,
            commaIndex !== -1 ? commaIndex : fileText.length
          );
          functionBody = fileText.substring(bodyStart, endIndex);
        }

        if (
          functionBody.includes("<") &&
          (functionBody.includes(">") || functionBody.includes("/>"))
        ) {
          // This looks like a React component
          const metadata: RawComponentMetadata = {
            name: componentName,
            filePath: sourceFile.fileName,
            exportName: componentName,
            props: [], // We'll extract these later if needed
          };

          components.push(this.createComponentEntry(metadata));
        }
      }

      // Skip compound component discovery for now to avoid AST issues
      // const compoundComponents = this.discoverCompoundComponents(sourceFile);
      // for (const compound of compoundComponents) {
      //   components.push(this.createComponentEntry(compound));
      // }

      return components;
    } catch (error) {
      console.error("Error scanning file:", error);
      return components; // Return empty array on error
    }
  }

  /**
   * Resolve properties from a type reference (interface/type alias)
   */
  private resolveTypeReferenceProps(
    typeReferenceNode: ts.TypeReferenceNode
  ): RawComponentMetadata["props"] {
    const props: RawComponentMetadata["props"] = [];

    try {
      if (!this.checker) {
        return props;
      }

      // Get the type from the type reference
      const type = this.checker.getTypeAtLocation(typeReferenceNode);
      if (!type) {
        console.log("Could not resolve type from type reference");
        return props;
      }

      // Get properties of the type
      const typeProperties = this.checker.getPropertiesOfType(type);
      if (!typeProperties || typeProperties.length === 0) {
        console.log("No properties found in resolved type");
        return props;
      }

      console.log(
        `Found ${
          typeProperties.length
        } properties in type ${this.checker.typeToString(type)}`
      );

      // Process each property
      for (const prop of typeProperties) {
        if (!prop || !prop.name) {
          continue;
        }

        try {
          // Get the property's type
          const propType = this.checker.getTypeOfSymbolAtLocation(
            prop,
            typeReferenceNode
          );
          const required = !(prop.flags & ts.SymbolFlags.Optional);

          // Try to get JSDoc from the property declaration
          let description: string | undefined;
          const designTags: Record<string, string> = {};

          if (prop.valueDeclaration) {
            const jsDoc = (prop.valueDeclaration as any).jsDoc;
            if (jsDoc && jsDoc.length > 0) {
              description = this.getJSDocComment(jsDoc[0]);

              const tags = jsDoc[0].tags;
              if (tags) {
                for (const tag of tags) {
                  if (
                    tag?.tagName &&
                    typeof tag.tagName === "object" &&
                    tag.tagName.text
                  ) {
                    const tagName = tag.tagName.text;
                    if (
                      tagName === "designControl" ||
                      tagName === "designOptions"
                    ) {
                      designTags[tagName] = this.getJSDocComment(tag);
                    }
                  }
                }
              }
            }
          }

          // Safely get the type string
          let typeString = "unknown";
          try {
            typeString = this.checker.typeToString(propType);
          } catch (typeError) {
            console.warn(
              `Could not get type string for property ${prop.name}:`,
              typeError
            );
          }

          props.push({
            name: prop.name,
            type: typeString,
            required,
            description,
            designTags:
              Object.keys(designTags).length > 0 ? designTags : undefined,
          });

          console.log(
            `Successfully extracted property: ${prop.name} (${typeString})`
          );
        } catch (propError) {
          console.warn(`Error processing property ${prop.name}:`, propError);
          // Continue with other properties instead of failing completely
        }
      }
    } catch (error) {
      console.error("Error in resolveTypeReferenceProps:", error);
    }

    return props;
  }

  /**
   * Check if node is a React component
   */
  private isReactComponent(node: ts.Node): boolean {
    try {
      // Function declaration: function MyComponent() {}
      if (ts.isFunctionDeclaration(node)) {
        return this.hasJSXReturnType(node);
      }

      // Variable declaration with arrow function: const MyComponent = () => {}
      if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList?.declarations?.[0];
        if (
          declaration?.initializer &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        ) {
          return this.hasJSXReturnType(
            declaration.initializer as ts.ArrowFunction
          );
        }
      }

      // Class component
      if (ts.isClassDeclaration(node)) {
        return this.extendsReactComponent(node);
      }

      return false;
    } catch (error) {
      console.warn("Error checking if node is React component:", error);
      return false;
    }
  }

  /**
   * Check if function returns JSX
   */
  private hasJSXReturnType(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): boolean {
    try {
      if (!this.checker) {
        return false;
      }

      // First, check if explicit return type annotation is JSX
      if (node.type) {
        const typeText = node.type.getText();
        if (
          typeText.includes("JSX.Element") ||
          typeText.includes("React.ReactElement") ||
          typeText.includes("ReactNode")
        ) {
          return true;
        }
      }

      // Try to get the signature and check return type
      const signature = this.checker.getSignatureFromDeclaration(node);
      if (signature) {
        const returnType = this.checker.getReturnTypeOfSignature(signature);
        const typeString = this.checker.typeToString(returnType);

        if (
          typeString.includes("JSX.Element") ||
          typeString.includes("React.ReactElement") ||
          typeString.includes("ReactNode")
        ) {
          return true;
        }
      }

      // As a fallback, check if the function body contains JSX
      // This is more expensive but catches cases where type inference fails
      return this.hasJSXInBody(node.body);
    } catch (error) {
      console.warn("Error checking JSX return type:", error);
      return false;
    }
  }

  /**
   * Check if function body contains JSX elements
   */
  private hasJSXInBody(body: ts.ConciseBody | undefined): boolean {
    try {
      if (!body) {
        return false;
      }

      let hasJSX = false;

      const visitor = (node: ts.Node): void => {
        if (!node) {
          return;
        }

        if (
          ts.isJsxElement(node) ||
          ts.isJsxSelfClosingElement(node) ||
          ts.isJsxFragment(node)
        ) {
          hasJSX = true;
          return;
        }
        if (node) {
          ts.forEachChild(node, visitor);
        }
      };

      if (ts.isBlock(body)) {
        if (body) {
          ts.forEachChild(body, visitor);
        }
      } else {
        // Arrow function expression body
        if (body) {
          visitor(body);
        }
      }

      return hasJSX;
    } catch (error) {
      console.warn("Error checking JSX in body:", error);
      return false;
    }
  }

  /**
   * Check if class extends React.Component
   */
  private extendsReactComponent(node: ts.ClassDeclaration): boolean {
    try {
      if (!node.heritageClauses) {
        return false;
      }

      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          for (const type of clause.types) {
            const text = type.expression.getText();
            if (text.includes("Component") || text.includes("PureComponent")) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.warn("Error checking if class extends React component:", error);
      return false;
    }
  }

  /**
   * Extract component metadata from AST node
   */
  private extractComponentMetadata(
    node: ts.Node,
    sourceFile: ts.SourceFile
  ): RawComponentMetadata | null {
    try {
      // First extract the component metadata normally
      const metadata = this.extractComponentMetadataBase(node, sourceFile);
      if (!metadata) {
        return null;
      }

      // Then try to extract default values from the implementation
      // Temporarily disabled to debug the issue
      // const defaultValues = this.extractDefaultValues(node, sourceFile);
      // if (defaultValues) {
      //   // Merge default values into props
      //   metadata.props = metadata.props.map((prop) => {
      //     const defaultValue = defaultValues[prop.name];
      //     return defaultValue !== undefined ? { ...prop, defaultValue } : prop;
      //   });
      // }

      return metadata;
    } catch (error) {
      console.warn("Error extracting component metadata:", error);
      return null;
    }
  }

  /**
   * Discover compound components (e.g., Card.Header, Menu.Item)
   */
  private discoverCompoundComponents(
    sourceFile: ts.SourceFile
  ): RawComponentMetadata[] {
    const compounds: RawComponentMetadata[] = [];

    try {
      // Walk the source file to find property assignments like: Component.SubComponent = ...
      const visitor = (node: ts.Node): void => {
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.name.text !== "defaultProps" // Skip defaultProps
        ) {
          // Check if this is part of an assignment: Component.SubComponent = ...
          let current: ts.Node = node;
          while (
            current &&
            !ts.isBinaryExpression(current) &&
            !ts.isJsxElement(current) &&
            !ts.isJsxSelfClosingElement(current) &&
            !ts.isJsxFragment(current)
          ) {
            current = current.parent;
          }

          if (
            current &&
            ts.isBinaryExpression(current) &&
            current.operatorToken &&
            current.operatorToken.kind === ts.SyntaxKind.EqualsToken
          ) {
            const baseComponentName = node.expression.text;
            const subComponentName = node.name.text;

            // Check if the right side is a component function
            const rightSide = current.right;
            if (
              ts.isArrowFunction(rightSide) ||
              ts.isFunctionExpression(rightSide) ||
              ts.isIdentifier(rightSide) // Could reference another component
            ) {
              // Check if this looks like a React component
              const isComponent =
                ts.isArrowFunction(rightSide) ||
                ts.isFunctionExpression(rightSide)
                  ? this.hasJSXReturnType(rightSide)
                  : this.isReactComponent(rightSide); // If identifier, check if it references a component

              if (isComponent) {
                // Create a compound component entry
                const compoundName = `${baseComponentName}.${subComponentName}`;

                // Extract props from the compound component function
                let props: RawComponentMetadata["props"] = [];
                if (
                  ts.isArrowFunction(rightSide) ||
                  ts.isFunctionExpression(rightSide)
                ) {
                  // Extract props from function parameters
                  const metadata = this.extractComponentMetadataBase(
                    rightSide as any,
                    sourceFile
                  );
                  if (metadata) {
                    props = metadata.props;
                  }
                }

                compounds.push({
                  name: compoundName,
                  filePath: sourceFile.fileName,
                  exportName: compoundName,
                  props: props, // Extract props from compound component
                  jsDocTags: {
                    category: "compound",
                    parent: baseComponentName,
                  },
                });
              }
            }
          }
        }

        if (node) {
          ts.forEachChild(node, visitor);
        }
      };

      if (sourceFile) {
        ts.forEachChild(sourceFile, visitor);
      }
      return compounds;
    } catch (error) {
      console.warn("Error discovering compound components:", error);
      return [];
    }
  }

  /**
   * Extract component metadata from AST node (base implementation)
   */
  private extractComponentMetadataBase(
    node: ts.Node,
    sourceFile: ts.SourceFile
  ): RawComponentMetadata | null {
    if (!this.checker) {
      return null;
    }

    try {
      let name: string | undefined;
      let props: RawComponentMetadata["props"] = [];
      const jsDocTags: Record<string, string> = {};

      // Get component name
      if (ts.isFunctionDeclaration(node) && node.name) {
        name = node.name.text;
      } else if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList?.declarations?.[0];
        if (declaration?.name && ts.isIdentifier(declaration.name)) {
          name = declaration.name.text;
        }
      } else if (ts.isClassDeclaration(node) && node.name) {
        name = node.name.text;
      }

      if (!name) {
        return null;
      }

      // Extract JSDoc comments from the component node
      // Temporarily disabled to debug the issue
      // try {
      //   const jsDoc = (node as any).jsDoc;
      //   if (jsDoc && jsDoc.length > 0) {
      //     const tags = jsDoc[0]?.tags;
      //     if (tags) {
      //       for (const tag of tags) {
      //         if (tag?.tagName) {
      //           const tagName = tag.tagName.text;
      //           const comment = this.getJSDocComment(tag);
      //           jsDocTags[tagName] = comment;
      //         }
      //       }
      //     }
      //   }
      // } catch (error) {
      //   // Silently handle JSDoc parsing errors
      //   console.warn("JSDoc parsing error:", error);
      // }

      // Also try to extract JSDoc from related interface (for function components with separate interface)
      // Temporarily disabled to debug the issue
      // if (
      //   (ts.isFunctionDeclaration(node) ||
      //     ts.isArrowFunction(node) ||
      //     ts.isFunctionExpression(node) ||
      //     ts.isVariableStatement(node)) &&
      //   this.checker
      // ) {
      //   const firstParam =
      //     ts.isFunctionDeclaration(node) ||
      //     ts.isArrowFunction(node) ||
      //     ts.isFunctionExpression(node)
      //       ? node.parameters?.[0]
      //       : ts.isVariableStatement(node) &&
      //         node.declarationList?.declarations?.[0]?.initializer &&
      //         (ts.isArrowFunction(
      //           node.declarationList.declarations[0].initializer
      //         ) ||
      //           ts.isFunctionExpression(
      //             node.declarationList.declarations[0].initializer
      //           ))
      //       ? node.declarationList.declarations[0].initializer.parameters?.[0]
      //       : undefined;

      //   if (firstParam?.type && ts.isTypeReferenceNode(firstParam.type)) {
      //     const type = this.checker.getTypeAtLocation(firstParam.type);
      //     const symbol = type.getSymbol();
      //     if (symbol && symbol.declarations && symbol.declarations.length > 0) {
      //       try {
      //         const interfaceDecl = symbol.declarations[0];
      //         const interfaceJsDoc = (interfaceDecl as any).jsDoc;
      //         if (interfaceJsDoc && interfaceJsDoc.length > 0) {
      //           const interfaceTags = interfaceJsDoc[0]?.tags;
      //           if (interfaceTags) {
      //             for (const tag of interfaceTags) {
      //               if (tag?.tagName) {
      //                 const tagName = tag.tagName.text;
      //                 // Only add if not already present from component JSDoc
      //                 if (!jsDocTags[tagName]) {
      //                   jsDocTags[tagName] = this.getJSDocComment(tag);
      //                 }
      //               }
      //             }
      //           }
      //         }
      //       } catch (error) {
      //         // Silently handle interface JSDoc parsing errors
      //         console.warn("Interface JSDoc parsing error:", error);
      //       }
      //     }
      //   }
      // }

      // Extract props from first parameter (for function components)
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
      ) {
        const firstParam = node.parameters?.[0];
        if (firstParam?.type) {
          console.log("Extracting props from function parameter");
          props = this.extractPropsFromType(firstParam.type);
          console.log(
            `Extracted ${props.length} props from function parameter`
          );
        }
      } else if (ts.isVariableStatement(node)) {
        // Handle arrow function assigned to variable
        const declaration = node.declarationList?.declarations?.[0];
        if (
          declaration?.initializer &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        ) {
          const firstParam = declaration.initializer.parameters?.[0];
          if (firstParam?.type) {
            console.log("Extracting props from variable declaration parameter");
            props = this.extractPropsFromType(firstParam.type);
            console.log(
              `Extracted ${props.length} props from variable declaration parameter`
            );
          }
        }
      }

      // Extract props from class component
      if (ts.isClassDeclaration(node) && node.heritageClauses) {
        for (const clause of node.heritageClauses) {
          if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
            const typeArgs = clause.types[0].typeArguments;
            if (typeArgs && typeArgs[0]) {
              props = this.extractPropsFromType(typeArgs[0]);
            }
          }
        }
      }

      return {
        name,
        filePath: sourceFile.fileName,
        exportName: name,
        props,
        jsDocTags,
      };
    } catch (error) {
      console.warn("Error extracting component metadata:", error);
      return null;
    }
  }

  /**
   * Extract props from TypeScript type
   */
  private extractPropsFromType(
    typeNode: ts.TypeNode
  ): RawComponentMetadata["props"] {
    if (!this.checker) {
      return [];
    }

    const props: RawComponentMetadata["props"] = [];

    try {
      if (ts.isTypeLiteralNode(typeNode)) {
        if (typeNode.members) {
          for (const member of typeNode.members) {
            if (ts.isPropertySignature(member) && member.name) {
              try {
                const propName = member.name.getText();
                const propType = member.type
                  ? member.type.getText()
                  : "unknown";
                const required = !member.questionToken;

                // Extract JSDoc for this property
                const jsDoc = (member as any).jsDoc;
                let description: string | undefined;
                const designTags: Record<string, string> = {};

                if (jsDoc && jsDoc.length > 0) {
                  // Get description from JSDoc comment
                  description = this.getJSDocComment(jsDoc[0]);

                  // Get design-specific tags
                  const tags = jsDoc[0].tags;
                  if (tags) {
                    for (const tag of tags) {
                      if (tag?.tagName) {
                        const tagName = tag.tagName.text;
                        if (
                          tagName === "designControl" ||
                          tagName === "designOptions"
                        ) {
                          designTags[tagName] = this.getJSDocComment(tag);
                        }
                      }
                    }
                  }
                }

                props.push({
                  name: propName,
                  type: propType,
                  required,
                  description,
                  designTags:
                    Object.keys(designTags).length > 0 ? designTags : undefined,
                });
              } catch (error) {
                console.warn("Error extracting prop:", error);
              }
            }
          }
        }
      } else if (ts.isTypeReferenceNode(typeNode)) {
        // Handle interface/type references with improved error handling
        try {
          console.log("Processing type reference node");
          if (!this.checker) {
            console.log("No checker available");
            return props;
          }

          const resolvedProps = this.resolveTypeReferenceProps(typeNode);
          props.push(...resolvedProps);
          console.log(
            `Added ${resolvedProps.length} props from type reference`
          );
        } catch (error) {
          console.error("Error extracting props from type reference:", error);
          // Return empty props instead of throwing
          return [];
        }
      }

      return props;
    } catch (error) {
      console.warn("Error extracting props from type:", error);
      return [];
    }
  }

  /**
   * Get JSDoc comment text from a JSDoc node or tag
   */
  private getJSDocComment(jsDocNode: any): string {
    try {
      if (!jsDocNode) {
        return "";
      }

      try {
        // Handle string comments
        if (typeof jsDocNode.comment === "string") {
          return jsDocNode.comment;
        }

        // Handle comment arrays (multi-line comments)
        if (Array.isArray(jsDocNode.comment)) {
          return jsDocNode.comment
            .map((c: any) => (typeof c === "string" ? c : c?.text || ""))
            .join("\n");
        }
      } catch (error) {
        // Silently handle JSDoc parsing errors
        console.warn("JSDoc parsing error:", error);
      }

      return "";
    } catch (error) {
      console.warn("Error getting JSDoc comment:", error);
      return "";
    }
  }

  /**
   * Extract default values from component implementation
   */
  private extractDefaultValues(
    node: ts.Node,
    sourceFile: ts.SourceFile
  ): Record<string, unknown> | null {
    try {
      const defaultValues: Record<string, unknown> = {};

      // 1. Extract from function parameter defaults
      this.extractFromFunctionParameters(node, defaultValues);

      // 2. Extract from defaultProps assignment
      this.extractFromDefaultProps(node, sourceFile, defaultValues);

      // 3. Extract from destructuring defaults in function body
      this.extractFromDestructuringDefaults(node, defaultValues);

      return Object.keys(defaultValues).length > 0 ? defaultValues : null;
    } catch (error) {
      console.warn("Error extracting default values:", error);
      return null;
    }
  }

  /**
   * Extract default values from function parameters (destructuring)
   */
  private extractFromFunctionParameters(
    node: ts.Node,
    defaultValues: Record<string, unknown>
  ): void {
    try {
      if (!node) {
        return;
      }

      let parameters: readonly ts.ParameterDeclaration[] | undefined;

      if (ts.isFunctionDeclaration(node)) {
        parameters = node.parameters;
      } else if (ts.isArrowFunction(node)) {
        parameters = node.parameters;
      } else if (ts.isFunctionExpression(node)) {
        parameters = node.parameters;
      } else if (ts.isVariableStatement(node)) {
        // Handle arrow function assigned to variable
        const declaration = node.declarationList?.declarations?.[0];
        if (
          declaration?.initializer &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        ) {
          parameters = declaration.initializer.parameters;
        }
      }

      if (parameters && parameters.length > 0) {
        const firstParam = parameters[0];
        if (firstParam) {
          // Handle destructuring parameter: ({ variant = "primary" }: Props)
          if (firstParam.name && ts.isObjectBindingPattern(firstParam.name)) {
            this.extractDefaultsFromBindingPattern(
              firstParam.name,
              defaultValues
            );
          }
          // Handle inline type literal with defaults: ({ variant = "primary" }: { variant?: string })
          else if (firstParam.type && ts.isTypeLiteralNode(firstParam.type)) {
            this.extractDefaultsFromTypeLiteral(firstParam.type, defaultValues);
          }
        }
      }
    } catch (error) {
      console.warn("Error extracting from function parameters:", error);
    }
  }

  /**
   * Extract defaults from inline type literal parameters
   */
  private extractDefaultsFromTypeLiteral(
    typeLiteral: ts.TypeLiteralNode,
    _defaultValues: Record<string, unknown>
  ): void {
    try {
      if (!typeLiteral?.members) {
        return;
      }

      for (const member of typeLiteral.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const _propName = member.name.getText();

          // Look for default value in the initializer (if present in destructuring)
          // Note: TypeScript AST doesn't directly store destructuring defaults in type literals
          // We need to look at the parameter declaration itself
          // This is handled in extractFromDestructuringDefaults
        }
      }
    } catch (error) {
      console.warn("Error extracting defaults from type literal:", error);
    }
  }

  /**
   * Extract default values from defaultProps assignments
   */
  private extractFromDefaultProps(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    defaultValues: Record<string, unknown>
  ): void {
    try {
      const componentName = this.getComponentName(node);
      if (!componentName) {
        return;
      }

      // Walk the source file to find defaultProps assignments
      const visitor = (node: ts.Node): void => {
        if (!node) {
          return;
        }

        // Look for: ComponentName.defaultProps = { ... }
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === componentName &&
          node.name.text === "defaultProps"
        ) {
          // Find the parent assignment
          let current: ts.Node = node;
          while (current && !ts.isBinaryExpression(current)) {
            current = current.parent;
          }

          if (
            current &&
            ts.isBinaryExpression(current) &&
            current.operatorToken &&
            current.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            current.right &&
            ts.isObjectLiteralExpression(current.right)
          ) {
            this.extractDefaultsFromObjectLiteral(current.right, defaultValues);
          }
        }

        if (node) {
          ts.forEachChild(node, visitor);
        }
      };

      if (sourceFile) {
        ts.forEachChild(sourceFile, visitor);
      }
    } catch (error) {
      console.warn("Error extracting from defaultProps:", error);
    }
  }

  /**
   * Extract default values from destructuring defaults in function body
   */
  private extractFromDestructuringDefaults(
    node: ts.Node,
    defaultValues: Record<string, unknown>
  ): void {
    try {
      if (!node) {
        return;
      }

      let body: ts.ConciseBody | undefined;

      if (ts.isFunctionDeclaration(node)) {
        body = node.body;
      } else if (ts.isArrowFunction(node)) {
        body = node.body;
      } else if (ts.isFunctionExpression(node)) {
        body = node.body;
      } else if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList?.declarations?.[0];
        if (
          declaration?.initializer &&
          ts.isArrowFunction(declaration.initializer)
        ) {
          body = declaration.initializer.body;
        }
      }

      if (!body) {
        return;
      }

      // Walk the body to find destructuring assignments
      const visitor = (node: ts.Node): void => {
        if (!node) {
          return;
        }

        // Look for: const { variant = "primary" } = props;
        if (
          ts.isVariableStatement(node) ||
          ts.isVariableDeclarationList(node)
        ) {
          const declarations = ts.isVariableStatement(node)
            ? node.declarationList?.declarations
            : node.declarations;

          if (declarations) {
            for (const declaration of declarations) {
              if (
                declaration?.initializer &&
                declaration.name &&
                ts.isObjectBindingPattern(declaration.name)
              ) {
                // Found destructuring: const { prop1 = default1, prop2 = default2 } = props
                this.extractDefaultsFromBindingPattern(
                  declaration.name,
                  defaultValues
                );
              }
            }
          }
        }

        if (node) {
          ts.forEachChild(node, visitor);
        }
      };

      if (ts.isBlock(body)) {
        if (body) {
          ts.forEachChild(body, visitor);
        }
      } else {
        // Arrow function with expression body - still might have destructuring in a wrapper block
        if (body) {
          visitor(body);
        }
      }
    } catch (error) {
      console.warn("Error extracting from destructuring defaults:", error);
    }
  }

  /**
   * Extract defaults from object binding pattern (destructuring)
   */
  private extractDefaultsFromBindingPattern(
    bindingPattern: ts.ObjectBindingPattern,
    defaultValues: Record<string, unknown>
  ): void {
    try {
      if (!bindingPattern?.elements) {
        return;
      }

      for (const element of bindingPattern.elements) {
        if (
          ts.isBindingElement(element) &&
          element.initializer &&
          element.name
        ) {
          // Found: prop = defaultValue
          const propName = element.name.getText();
          const defaultValue = this.evaluateDefaultValue(element.initializer);
          if (defaultValue !== undefined) {
            defaultValues[propName] = defaultValue;
          }
        }
      }
    } catch (error) {
      console.warn("Error extracting defaults from binding pattern:", error);
    }
  }

  /**
   * Extract defaults from object literal expression
   */
  private extractDefaultsFromObjectLiteral(
    objectLiteral: ts.ObjectLiteralExpression,
    defaultValues: Record<string, unknown>
  ): void {
    try {
      if (!objectLiteral?.properties) {
        return;
      }

      for (const property of objectLiteral.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          ts.isIdentifier(property.name) &&
          property.initializer
        ) {
          const propName = property.name.text;
          const defaultValue = this.evaluateDefaultValue(property.initializer);
          if (defaultValue !== undefined) {
            defaultValues[propName] = defaultValue;
          }
        }
      }
    } catch (error) {
      console.warn("Error extracting defaults from object literal:", error);
    }
  }

  /**
   * Evaluate a default value expression to a concrete value
   */
  private evaluateDefaultValue(initializer: ts.Expression): unknown {
    try {
      if (!initializer) {
        return undefined;
      }

      // Handle string literals
      if (ts.isStringLiteral(initializer)) {
        return initializer.text;
      }

      // Handle numeric literals
      if (ts.isNumericLiteral(initializer)) {
        return Number(initializer.text);
      }

      // Handle boolean literals
      if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
        return true;
      }
      if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
        return false;
      }

      // Handle null literal
      if (initializer.kind === ts.SyntaxKind.NullKeyword) {
        return null;
      }

      // Handle undefined (void 0 or undefined keyword)
      if (
        initializer.kind === ts.SyntaxKind.UndefinedKeyword ||
        (ts.isVoidExpression(initializer) &&
          initializer.expression &&
          ts.isNumericLiteral(initializer.expression) &&
          initializer.expression.text === "0")
      ) {
        return undefined;
      }

      // Handle array literals
      if (ts.isArrayLiteralExpression(initializer)) {
        return initializer.elements.map((element) =>
          this.evaluateDefaultValue(element)
        );
      }

      // Handle object literals (shallow)
      if (ts.isObjectLiteralExpression(initializer)) {
        const obj: Record<string, unknown> = {};
        if (initializer.properties) {
          for (const property of initializer.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.initializer
            ) {
              obj[property.name.text] = this.evaluateDefaultValue(
                property.initializer
              );
            }
          }
        }
        return obj;
      }

      // For complex expressions, return undefined (can't evaluate statically)
      // This includes function calls, identifiers, etc.
      return undefined;
    } catch (error) {
      console.warn("Error evaluating default value:", error);
      return undefined;
    }
  }

  /**
   * Get component name from AST node
   */
  private getComponentName(node: ts.Node): string | undefined {
    try {
      if (ts.isFunctionDeclaration(node) && node.name) {
        return node.name.text;
      } else if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList?.declarations?.[0];
        if (declaration?.name && ts.isIdentifier(declaration.name)) {
          return declaration.name.text;
        }
      } else if (ts.isClassDeclaration(node) && node.name) {
        return node.name.text;
      }
      return undefined;
    } catch (error) {
      console.warn("Error getting component name:", error);
      return undefined;
    }
  }

  /**
   * Create component entry from raw metadata
   */
  private createComponentEntry(metadata: RawComponentMetadata): ComponentEntry {
    try {
      if (!metadata) {
        throw new Error("Metadata is required");
      }

      return {
        id: ulid().toLowerCase(),
        name: metadata.name,
        modulePath: metadata.filePath,
        export: metadata.exportName,
        category: metadata.jsDocTags?.category,
        tags: metadata.jsDocTags?.tags?.split(",").map((t) => t.trim()),
        props: (metadata.props || []).map((prop) => {
          const propEntry: ComponentProp = {
            name: prop.name,
            type: prop.type,
            required: prop.required,
            defaultValue:
              prop.defaultValue !== undefined
                ? (prop.defaultValue as
                    | string
                    | number
                    | boolean
                    | Record<string, unknown>
                    | null)
                : undefined,
            description: prop.description,
          };

          // Parse design tags if present
          if (prop.designTags) {
            // Handle @designControl tag
            if (prop.designTags.designControl) {
              const control = prop.designTags.designControl.trim();
              if (
                control === "text" ||
                control === "select" ||
                control === "color" ||
                control === "number" ||
                control === "boolean"
              ) {
                propEntry.design = {
                  ...propEntry.design,
                  control,
                };
              }
            }

            // Handle @designOptions tag
            if (prop.designTags.designOptions) {
              const optionsStr = prop.designTags.designOptions.trim();
              // Parse options (comma-separated values)
              const options = optionsStr
                .split(",")
                .map((o) => o.trim())
                .filter((o) => o.length > 0);
              if (options.length > 0) {
                propEntry.design = {
                  ...propEntry.design,
                  options,
                };
              }
            }
          }

          return propEntry;
        }),
        // Add examples and variants from JSDoc
        examples: metadata.jsDocTags?.example
          ? [metadata.jsDocTags.example]
          : undefined,
        variants: metadata.jsDocTags?.variant
          ? this.parseVariants(metadata.jsDocTags.variant)
          : undefined,
        // Compound component support
        parent: metadata.jsDocTags?.parent, // Parent component name
        isCompound: metadata.jsDocTags?.category === "compound", // True if compound
        compoundChildren: undefined, // Will be populated during post-processing
      };
    } catch (error) {
      console.warn("Error creating component entry:", error);
      throw error;
    }
  }

  /**
   * Parse variant information from JSDoc
   */
  private parseVariants(
    variantStr: string
  ): Array<Record<string, unknown>> | undefined {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(variantStr);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [parsed];
    } catch {
      // If not JSON, treat as comma-separated variant names
      const names = variantStr.split(",").map((v) => v.trim());
      return names.map((name) => ({ name }));
    }
  }
}

/**
 * Convenience function to discover components
 */
export async function discoverComponents(
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const scanner = new ComponentScanner();
  return scanner.discover(options);
}
