/**
 * @fileoverview TypeScript Compiler API-based component scanner
 * @author @darianrosebrook
 */

import * as ts from "typescript";
import * as path from "node:path";
import * as fs from "node:fs";
import { ulid } from "ulidx";
import type {
  DiscoveryOptions,
  DiscoveryResult,
  ComponentEntry,
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
    const startTime = Date.now();
    const components: ComponentEntry[] = [];
    const errors: Array<{ file: string; error: string }> = [];
    let filesScanned = 0;

    try {
      // Load tsconfig or create default config
      const configPath =
        options.tsconfigPath ?? path.join(options.rootDir, "tsconfig.json");
      const configFile = this.loadTsConfig(configPath, options.rootDir);

      // Create TypeScript program
      this.program = ts.createProgram(configFile.fileNames, configFile.options);
      this.checker = this.program.getTypeChecker();

      // Scan each source file
      for (const sourceFile of this.program.getSourceFiles()) {
        if (this.shouldScanFile(sourceFile, options)) {
          filesScanned++;
          try {
            const fileComponents = this.scanFile(sourceFile);
            components.push(...fileComponents);
          } catch (error) {
            errors.push({
              file: sourceFile.fileName,
              error: error instanceof Error ? error.message : String(error),
            });
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

    const scan = (currentDir: string) => {
      if (!fs.existsSync(currentDir)) return;

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

    // Skip declaration files
    if (filePath.endsWith(".d.ts")) return false;

    // Skip node_modules
    if (filePath.includes("node_modules")) return false;

    // Check includes
    if (options.include && options.include.length > 0) {
      const included = options.include.some((pattern) =>
        filePath.includes(pattern)
      );
      if (!included) return false;
    }

    // Check excludes
    if (options.exclude && options.exclude.length > 0) {
      const excluded = options.exclude.some((pattern) =>
        filePath.includes(pattern)
      );
      if (excluded) return false;
    }

    return true;
  }

  /**
   * Scan a single TypeScript file for React components
   */
  private scanFile(sourceFile: ts.SourceFile): ComponentEntry[] {
    const components: ComponentEntry[] = [];

    const visit = (node: ts.Node) => {
      // Look for function declarations, arrow functions, and class declarations
      if (this.isReactComponent(node)) {
        const metadata = this.extractComponentMetadata(node, sourceFile);
        if (metadata) {
          components.push(this.createComponentEntry(metadata));
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return components;
  }

  /**
   * Check if node is a React component
   */
  private isReactComponent(node: ts.Node): boolean {
    // Function declaration: function MyComponent() {}
    if (ts.isFunctionDeclaration(node)) {
      return this.hasJSXReturnType(node);
    }

    // Variable declaration with arrow function: const MyComponent = () => {}
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
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
  }

  /**
   * Check if function returns JSX
   */
  private hasJSXReturnType(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): boolean {
    if (!this.checker) return false;

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

    return false;
  }

  /**
   * Check if class extends React.Component
   */
  private extendsReactComponent(node: ts.ClassDeclaration): boolean {
    if (!node.heritageClauses) return false;

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
  }

  /**
   * Extract component metadata from AST node
   */
  private extractComponentMetadata(
    node: ts.Node,
    sourceFile: ts.SourceFile
  ): RawComponentMetadata | null {
    if (!this.checker) return null;

    let name: string | undefined;
    let props: RawComponentMetadata["props"] = [];
    let jsDocTags: Record<string, string> = {};

    // Get component name
    if (ts.isFunctionDeclaration(node) && node.name) {
      name = node.name.text;
    } else if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration?.name && ts.isIdentifier(declaration.name)) {
        name = declaration.name.text;
      }
    } else if (ts.isClassDeclaration(node) && node.name) {
      name = node.name.text;
    }

    if (!name) return null;

    // Extract JSDoc comments
    const jsDoc = (node as any).jsDoc;
    if (jsDoc && jsDoc.length > 0) {
      const tags = jsDoc[0].tags;
      if (tags) {
        for (const tag of tags) {
          if (tag.tagName) {
            jsDocTags[tag.tagName.text] = tag.comment ?? "";
          }
        }
      }
    }

    // Extract props from first parameter (for function components)
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node)
    ) {
      const firstParam = node.parameters[0];
      if (firstParam?.type) {
        props = this.extractPropsFromType(firstParam.type);
      }
    } else if (ts.isVariableStatement(node)) {
      // Handle arrow function assigned to variable
      const declaration = node.declarationList.declarations[0];
      if (
        declaration?.initializer &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer))
      ) {
        const firstParam = declaration.initializer.parameters[0];
        if (firstParam?.type) {
          props = this.extractPropsFromType(firstParam.type);
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
  }

  /**
   * Extract props from TypeScript type
   */
  private extractPropsFromType(
    typeNode: ts.TypeNode
  ): RawComponentMetadata["props"] {
    if (!this.checker) return [];

    const props: RawComponentMetadata["props"] = [];

    if (ts.isTypeLiteralNode(typeNode)) {
      for (const member of typeNode.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText();
          const propType = member.type ? member.type.getText() : "unknown";
          const required = !member.questionToken;

          props.push({
            name: propName,
            type: propType,
            required,
          });
        }
      }
    } else if (ts.isTypeReferenceNode(typeNode)) {
      // Handle interface/type references
      const type = this.checker.getTypeAtLocation(typeNode);
      const typeProperties = this.checker.getPropertiesOfType(type);

      for (const prop of typeProperties) {
        const propType = this.checker.getTypeOfSymbolAtLocation(prop, typeNode);
        const required = !(prop.flags & ts.SymbolFlags.Optional);

        props.push({
          name: prop.name,
          type: this.checker.typeToString(propType),
          required,
        });
      }
    }

    return props;
  }

  /**
   * Create component entry from raw metadata
   */
  private createComponentEntry(metadata: RawComponentMetadata): ComponentEntry {
    return {
      id: ulid().toLowerCase(),
      name: metadata.name,
      modulePath: metadata.filePath,
      export: metadata.exportName,
      category: metadata.jsDocTags?.category,
      tags: metadata.jsDocTags?.tags?.split(",").map((t) => t.trim()),
      props: metadata.props.map((prop) => ({
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
      })),
    };
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
