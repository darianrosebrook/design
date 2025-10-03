import fs from "fs";
import path from "path";
import os from "os";

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

console.log("Testing error location...");

async function testScanner() {
  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "component-scanner-")
  );

  try {
    // Create a test component file
    const componentFile = path.join(tempDir, "Button.tsx");
    await fs.promises.writeFile(componentFile, testCode);

    // Simulate the scanner logic step by step
    console.log("Step 1: Import scanner");
    const { ComponentScanner } = await import("./src/scanner.js");

    console.log("Step 2: Create scanner");
    const scanner = new ComponentScanner();

    console.log("Step 3: Call discover");
    try {
      const result = await scanner.discover({ rootDir: tempDir });
      console.log("Discovery completed successfully");
      console.log(`Components found: ${result.components.length}`);
      console.log(`Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log("Errors:", result.errors);
      }
    } catch (error) {
      console.error("Error in discover method:", error);
      console.error("Stack:", error.stack);
    }
  } catch (error) {
    console.error("Error in testScanner:", error);
    console.error("Stack:", error.stack);
  } finally {
    // Clean up
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

testScanner();
