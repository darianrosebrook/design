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

console.log("Testing scanner logic...");

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

  // Test the scanner logic
  const visit = (node) => {
    if (!node) {
      console.log("NULL NODE");
      return;
    }

    // Check if it's a function declaration
    if (ts.isFunctionDeclaration(node)) {
      console.log(
        `Found function declaration: ${node.name?.text || "anonymous"}`
      );

      // Check if it has JSX return type
      const hasJSXReturn = hasJSXReturnType(node, checker);
      console.log(`  Has JSX return type: ${hasJSXReturn}`);

      // Check if it has JSX in body
      const hasJSXInBody = hasJSXInBodyMethod(node.body);
      console.log(`  Has JSX in body: ${hasJSXInBody}`);
    }

    ts.forEachChild(node, visit);
  };

  // Copy the hasJSXReturnType method from scanner
  function hasJSXReturnType(node, checker) {
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
    return hasJSXInBodyMethod(node.body);
  }

  // Copy the hasJSXInBody method from scanner
  function hasJSXInBodyMethod(body) {
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

  console.log("\nWalking AST:");
  visit(sourceFile);
} catch (error) {
  console.error("Error:", error);
  console.error("Stack:", error.stack);
}
