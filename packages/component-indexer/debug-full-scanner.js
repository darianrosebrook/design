import ts from "typescript";

// Simple test component
const testCode = `
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button(props: ButtonProps): JSX.Element {
  return <button onClick={props.onClick} disabled={props.disabled}>
    {props.label}
  </button>;
}
`;

console.log("Testing full scanner flow...");

try {
  // Create a source file
  const sourceFile = ts.createSourceFile(
    "test.tsx",
    testCode,
    ts.ScriptTarget.Latest,
    true
  );

  // Create a program and checker
  const program = ts.createProgram(["test.tsx"], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.React,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
  });

  const checker = program.getTypeChecker();

  console.log("Program and checker created successfully");

  // Test the full scanner flow
  const components = [];
  const errors = [];

  const visit = (node) => {
    if (!node) {
      console.log("NULL NODE in visit");
      return;
    }

    console.log(`Checking node: ${ts.SyntaxKind[node.kind]}`);

    // Check if it's a React component
    if (isReactComponent(node)) {
      console.log(`Found React component: ${getComponentName(node)}`);

      try {
        const metadata = extractComponentMetadata(node, sourceFile);
        if (metadata) {
          console.log(`Extracted metadata:`, metadata);
          components.push(metadata);
        }
      } catch (error) {
        console.error(`Error extracting metadata:`, error);
        errors.push({ file: sourceFile.fileName, error: error.message });
      }
    }

    ts.forEachChild(node, visit);
  };

  // Copy methods from scanner
  function isReactComponent(node) {
    // Function declaration: function MyComponent() {}
    if (ts.isFunctionDeclaration(node)) {
      return hasJSXReturnType(node);
    }

    // Variable declaration with arrow function: const MyComponent = () => {}
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (
        declaration?.initializer &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer))
      ) {
        return hasJSXReturnType(declaration.initializer);
      }
    }

    return false;
  }

  function hasJSXReturnType(node) {
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
    const signature = checker.getSignatureFromDeclaration(node);
    if (signature) {
      const returnType = checker.getReturnTypeOfSignature(signature);
      const typeString = checker.typeToString(returnType);

      if (
        typeString.includes("JSX.Element") ||
        typeString.includes("React.ReactElement") ||
        typeString.includes("ReactNode")
      ) {
        return true;
      }
    }

    // As a fallback, check if the function body contains JSX
    return hasJSXInBody(node.body);
  }

  function hasJSXInBody(body) {
    if (!body) {
      return false;
    }

    let hasJSX = false;

    const visitor = (node) => {
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

  function getComponentName(node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    } else if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration?.name && ts.isIdentifier(declaration.name)) {
        return declaration.name.text;
      }
    }
    return null;
  }

  function extractComponentMetadata(node, sourceFile) {
    console.log("Extracting metadata...");

    // First extract the component metadata normally
    const metadata = extractComponentMetadataBase(node, sourceFile);
    if (!metadata) {
      console.log("No base metadata found");
      return null;
    }

    console.log("Base metadata found:", metadata);

    // Then try to extract default values from the implementation
    try {
      const defaultValues = extractDefaultValues(node, sourceFile);
      console.log("Default values:", defaultValues);

      if (defaultValues) {
        // Merge default values into props
        metadata.props = metadata.props.map((prop) => {
          const defaultValue = defaultValues[prop.name];
          return defaultValue !== undefined ? { ...prop, defaultValue } : prop;
        });
      }
    } catch (error) {
      console.error("Error extracting default values:", error);
    }

    return metadata;
  }

  function extractComponentMetadataBase(node, sourceFile) {
    console.log("Extracting base metadata...");

    let name = getComponentName(node);
    let props = [];
    const jsDocTags = {};

    if (!name) {
      console.log("No component name found");
      return null;
    }

    console.log(`Component name: ${name}`);

    // Extract props from first parameter (for function components)
    if (ts.isFunctionDeclaration(node)) {
      const firstParam = node.parameters[0];
      if (firstParam?.type) {
        console.log("Extracting props from first parameter...");
        props = extractPropsFromType(firstParam.type);
        console.log(`Found ${props.length} props`);
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

  function extractPropsFromType(typeNode) {
    console.log("Extracting props from type...");
    const props = [];

    if (ts.isTypeLiteralNode(typeNode)) {
      console.log("Type literal node found");
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
      console.log("Type reference node found");
      const type = checker.getTypeAtLocation(typeNode);
      const typeProperties = checker.getPropertiesOfType(type);

      for (const prop of typeProperties) {
        const propType = checker.getTypeOfSymbolAtLocation(prop, typeNode);
        const required = !(prop.flags & ts.SymbolFlags.Optional);

        props.push({
          name: prop.name,
          type: checker.typeToString(propType),
          required,
        });
      }
    }

    return props;
  }

  function extractDefaultValues(_node, _sourceFile) {
    console.log("Extracting default values...");
    // This is a simplified version - just return null for now
    return null;
  }

  console.log("\nWalking AST:");
  visit(sourceFile);

  console.log(`\nResults:`);
  console.log(`Components found: ${components.length}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("Errors:", errors);
  }
} catch (error) {
  console.error("Error:", error);
  console.error("Stack:", error.stack);
}
