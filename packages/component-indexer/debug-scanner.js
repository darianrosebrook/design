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

console.log("Testing TypeScript AST parsing...");

try {
  // Create a source file
  const sourceFile = ts.createSourceFile(
    "test.tsx",
    testCode,
    ts.ScriptTarget.Latest,
    true
  );

  console.log("Source file created successfully");
  console.log("Source file kind:", sourceFile.kind);
  console.log("Source file statements count:", sourceFile.statements.length);

  // Walk the AST
  const visit = (node, depth = 0) => {
    if (!node) {
      console.log(`${"  ".repeat(depth)}NULL NODE`);
      return;
    }

    const indent = "  ".repeat(depth);
    console.log(
      `${indent}Node kind: ${node.kind} (${ts.SyntaxKind[node.kind]})`
    );

    if (ts.isFunctionDeclaration(node)) {
      console.log(
        `${indent}  Function name: ${node.name?.text || "anonymous"}`
      );
    }

    ts.forEachChild(node, (child) => visit(child, depth + 1));
  };

  console.log("\nWalking AST:");
  visit(sourceFile);
} catch (error) {
  console.error("Error:", error);
  console.error("Stack:", error.stack);
}
