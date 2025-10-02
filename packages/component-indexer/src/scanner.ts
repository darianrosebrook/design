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

    // TODO: Implement compound component detection
    // const compoundComponents = this.discoverCompoundComponents(sourceFile);
    // for (const compound of compoundComponents) {
    //   components.push(this.createComponentEntry(compound));
    // }

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

    // As a fallback, check if the function body contains JSX
    // This is more expensive but catches cases where type inference fails
    return this.hasJSXInBody(node.body);
  }

  /**
   * Check if function body contains JSX elements
   */
  private hasJSXInBody(body: ts.ConciseBody | undefined): boolean {
    if (!body) return false;

    let hasJSX = false;

    const visitor = (node: ts.Node): void => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
        hasJSX = true;
        return;
      }
      ts.forEachChild(node, visitor);
    };

    if (ts.isBlock(body)) {
      ts.forEachChild(body, visitor);
    } else {
      // Arrow function expression body
      visitor(body);
    }

    return hasJSX;
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
    // First extract the component metadata normally
    const metadata = this.extractComponentMetadataBase(node, sourceFile);
    if (!metadata) return null;

    // Then try to extract default values from the implementation
    const defaultValues = this.extractDefaultValues(node, sourceFile);
    if (defaultValues) {
      // Merge default values into props
      metadata.props = metadata.props.map((prop) => {
        const defaultValue = defaultValues[prop.name];
        return defaultValue !== undefined ? { ...prop, defaultValue } : prop;
      });
    }

    return metadata;
  }

  /**
   * Discover compound components (e.g., Card.Header, Menu.Item)
   */
  private discoverCompoundComponents(
    sourceFile: ts.SourceFile
  ): RawComponentMetadata[] {
    const compounds: RawComponentMetadata[] = [];

    // Walk the source file to find property assignments like: Component.SubComponent = ...
    const visitor = (node: ts.Node): void => {
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.name.text !== "defaultProps" // Skip defaultProps
      ) {
        // Check if this is part of an assignment: Component.SubComponent = ...
        let current: ts.Node = node;
        while (current && !ts.isBinaryExpression(current)) {
          current = current.parent;
        }

        if (
          ts.isBinaryExpression(current) &&
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
              ts.isArrowFunction(rightSide) || ts.isFunctionExpression(rightSide)
                ? this.hasJSXReturnType(rightSide)
                : this.isReactComponent(rightSide); // If identifier, check if it references a component

            if (isComponent) {
              // Create a compound component entry
              const compoundName = `${baseComponentName}.${subComponentName}`;
              const compoundId = `compound-${baseComponentName}-${subComponentName}`;

              compounds.push({
                name: compoundName,
                filePath: sourceFile.fileName,
                exportName: compoundName,
                props: [], // Compound components typically don't have their own props
                jsDocTags: {
                  category: "compound",
                  parent: baseComponentName,
                },
              });
            }
          }
        }
      }

      ts.forEachChild(node, visitor);
    };

    ts.forEachChild(sourceFile, visitor);
    return compounds;
  }

  /**
   * Extract component metadata from AST node (base implementation)
   */
  private extractComponentMetadataBase(
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

    // Extract JSDoc comments from the component node
    const jsDoc = (node as any).jsDoc;
    if (jsDoc && jsDoc.length > 0) {
      const tags = jsDoc[0].tags;
      if (tags) {
        for (const tag of tags) {
          if (tag.tagName) {
            const tagName = tag.tagName.text;
            const comment = this.getJSDocComment(tag);
            jsDocTags[tagName] = comment;
          }
        }
      }
    }

    // Also try to extract JSDoc from related interface (for function components with separate interface)
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isVariableStatement(node)) &&
      this.checker
    ) {
      const firstParam =
        ts.isFunctionDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
          ? node.parameters[0]
          : ts.isVariableStatement(node) &&
            node.declarationList.declarations[0]?.initializer &&
            (ts.isArrowFunction(
              node.declarationList.declarations[0].initializer
            ) ||
              ts.isFunctionExpression(
                node.declarationList.declarations[0].initializer
              ))
          ? node.declarationList.declarations[0].initializer.parameters[0]
          : undefined;

      if (firstParam?.type && ts.isTypeReferenceNode(firstParam.type)) {
        const type = this.checker.getTypeAtLocation(firstParam.type);
        const symbol = type.getSymbol();
        if (symbol && symbol.declarations && symbol.declarations.length > 0) {
          const interfaceDecl = symbol.declarations[0];
          const interfaceJsDoc = (interfaceDecl as any).jsDoc;
          if (interfaceJsDoc && interfaceJsDoc.length > 0) {
            const interfaceTags = interfaceJsDoc[0].tags;
            if (interfaceTags) {
              for (const tag of interfaceTags) {
                if (tag.tagName) {
                  const tagName = tag.tagName.text;
                  // Only add if not already present from component JSDoc
                  if (!jsDocTags[tagName]) {
                    jsDocTags[tagName] = this.getJSDocComment(tag);
                  }
                }
              }
            }
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
                if (tag.tagName) {
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
        }
      }
    } else if (ts.isTypeReferenceNode(typeNode)) {
      // Handle interface/type references
      const type = this.checker.getTypeAtLocation(typeNode);
      const typeProperties = this.checker.getPropertiesOfType(type);

      for (const prop of typeProperties) {
        const propType = this.checker.getTypeOfSymbolAtLocation(prop, typeNode);
        const required = !(prop.flags & ts.SymbolFlags.Optional);

        // Try to get JSDoc from the property declaration
        const declaration = prop.valueDeclaration;
        let description: string | undefined;
        const designTags: Record<string, string> = {};

        if (declaration) {
          const jsDoc = (declaration as any).jsDoc;
          if (jsDoc && jsDoc.length > 0) {
            description = this.getJSDocComment(jsDoc[0]);

            const tags = jsDoc[0].tags;
            if (tags) {
              for (const tag of tags) {
                if (tag.tagName) {
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

        props.push({
          name: prop.name,
          type: this.checker.typeToString(propType),
          required,
          description,
          designTags:
            Object.keys(designTags).length > 0 ? designTags : undefined,
        });
      }
    }

    return props;
  }

  /**
   * Get JSDoc comment text from a JSDoc node or tag
   */
  private getJSDocComment(jsDocNode: any): string {
    if (!jsDocNode) return "";

    // Handle string comments
    if (typeof jsDocNode.comment === "string") {
      return jsDocNode.comment;
    }

    // Handle comment arrays (multi-line comments)
    if (Array.isArray(jsDocNode.comment)) {
      return jsDocNode.comment
        .map((c: any) => (typeof c === "string" ? c : c.text || ""))
        .join("\n");
    }

    return "";
  }

  /**
   * Extract default values from component implementation
   */
  private extractDefaultValues(
    node: ts.Node,
    sourceFile: ts.SourceFile
  ): Record<string, unknown> | null {
    const defaultValues: Record<string, unknown> = {};

    // 1. Extract from function parameter defaults
    this.extractFromFunctionParameters(node, defaultValues);

    // 2. Extract from defaultProps assignment
    this.extractFromDefaultProps(node, sourceFile, defaultValues);

    // 3. Extract from destructuring defaults in function body
    this.extractFromDestructuringDefaults(node, defaultValues);

    return Object.keys(defaultValues).length > 0 ? defaultValues : null;
  }

  /**
   * Extract default values from function parameters (destructuring)
   */
  private extractFromFunctionParameters(
    node: ts.Node,
    defaultValues: Record<string, unknown>
  ): void {
    let parameters: readonly ts.ParameterDeclaration[] | undefined;

    if (ts.isFunctionDeclaration(node)) {
      parameters = node.parameters;
    } else if (ts.isArrowFunction(node)) {
      parameters = node.parameters;
    } else if (ts.isFunctionExpression(node)) {
      parameters = node.parameters;
    } else if (ts.isVariableStatement(node)) {
      // Handle arrow function assigned to variable
      const declaration = node.declarationList.declarations[0];
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
        if (
          firstParam.name &&
          ts.isObjectBindingPattern(firstParam.name)
        ) {
          this.extractDefaultsFromBindingPattern(firstParam.name, defaultValues);
        }
        // Handle inline type literal with defaults: ({ variant = "primary" }: { variant?: string })
        else if (firstParam.type && ts.isTypeLiteralNode(firstParam.type)) {
          this.extractDefaultsFromTypeLiteral(firstParam.type, defaultValues);
        }
      }
    }
  }

  /**
   * Extract defaults from inline type literal parameters
   */
  private extractDefaultsFromTypeLiteral(
    typeLiteral: ts.TypeLiteralNode,
    defaultValues: Record<string, unknown>
  ): void {
    for (const member of typeLiteral.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const propName = member.name.getText();

        // Look for default value in the initializer (if present in destructuring)
        // Note: TypeScript AST doesn't directly store destructuring defaults in type literals
        // We need to look at the parameter declaration itself
        // This is handled in extractFromDestructuringDefaults
      }
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
    const componentName = this.getComponentName(node);
    if (!componentName) return;

    // Walk the source file to find defaultProps assignments
    const visitor = (node: ts.Node): void => {
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
          ts.isBinaryExpression(current) &&
          current.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isObjectLiteralExpression(current.right)
        ) {
          this.extractDefaultsFromObjectLiteral(current.right, defaultValues);
        }
      }

      ts.forEachChild(node, visitor);
    };

    ts.forEachChild(sourceFile, visitor);
  }

  /**
   * Extract default values from destructuring defaults in function body
   */
  private extractFromDestructuringDefaults(
    node: ts.Node,
    defaultValues: Record<string, unknown>
  ): void {
    let body: ts.ConciseBody | undefined;

    if (ts.isFunctionDeclaration(node)) {
      body = node.body;
    } else if (ts.isArrowFunction(node)) {
      body = node.body;
    } else if (ts.isFunctionExpression(node)) {
      body = node.body;
    } else if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (
        declaration?.initializer &&
        ts.isArrowFunction(declaration.initializer)
      ) {
        body = declaration.initializer.body;
      }
    }

    if (!body) return;

    // Walk the body to find destructuring assignments
    const visitor = (node: ts.Node): void => {
      // Look for: const { variant = "primary" } = props;
      if (
        ts.isVariableStatement(node) ||
        ts.isVariableDeclarationList(node)
      ) {
        const declarations = ts.isVariableStatement(node)
          ? node.declarationList.declarations
          : node.declarations;

        for (const declaration of declarations) {
          if (
            declaration.initializer &&
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

      ts.forEachChild(node, visitor);
    };

    if (ts.isBlock(body)) {
      ts.forEachChild(body, visitor);
    } else {
      // Arrow function with expression body - still might have destructuring in a wrapper block
      visitor(body);
    }
  }

  /**
   * Extract defaults from object binding pattern (destructuring)
   */
  private extractDefaultsFromBindingPattern(
    bindingPattern: ts.ObjectBindingPattern,
    defaultValues: Record<string, unknown>
  ): void {
    for (const element of bindingPattern.elements) {
      if (ts.isBindingElement(element) && element.initializer) {
        // Found: prop = defaultValue
        const propName = element.name.getText();
        const defaultValue = this.evaluateDefaultValue(element.initializer);
        if (defaultValue !== undefined) {
          defaultValues[propName] = defaultValue;
        }
      }
    }
  }

  /**
   * Extract defaults from object literal expression
   */
  private extractDefaultsFromObjectLiteral(
    objectLiteral: ts.ObjectLiteralExpression,
    defaultValues: Record<string, unknown>
  ): void {
    for (const property of objectLiteral.properties) {
      if (
        ts.isPropertyAssignment(property) &&
        ts.isIdentifier(property.name)
      ) {
        const propName = property.name.text;
        const defaultValue = this.evaluateDefaultValue(property.initializer);
        if (defaultValue !== undefined) {
          defaultValues[propName] = defaultValue;
        }
      }
    }
  }

  /**
   * Evaluate a default value expression to a concrete value
   */
  private evaluateDefaultValue(initializer: ts.Expression): unknown {
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
      for (const property of initializer.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          ts.isIdentifier(property.name)
        ) {
          obj[property.name.text] = this.evaluateDefaultValue(
            property.initializer
          );
        }
      }
      return obj;
    }

    // For complex expressions, return undefined (can't evaluate statically)
    // This includes function calls, identifiers, etc.
    return undefined;
  }

  /**
   * Get component name from AST node
   */
  private getComponentName(node: ts.Node): string | undefined {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    } else if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration?.name && ts.isIdentifier(declaration.name)) {
        return declaration.name.text;
      }
    } else if (ts.isClassDeclaration(node) && node.name) {
      return node.name.text;
    }
    return undefined;
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
      props: metadata.props.map((prop) => {
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
    };
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
