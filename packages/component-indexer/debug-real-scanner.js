import fs from "fs";
import path from "path";
import os from "os";
import { ComponentScanner } from "./src/scanner.js";

console.log("Testing real scanner...");

async function testScanner() {
  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "component-scanner-")
  );

  try {
    // Create a test component file
    const componentFile = path.join(tempDir, "Button.tsx");
    await fs.promises.writeFile(
      componentFile,
      `
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
      `.trim()
    );

    console.log(`Created test file: ${componentFile}`);
    console.log(`File exists: ${fs.existsSync(componentFile)}`);

    // Test the scanner
    const scanner = new ComponentScanner();
    console.log("Scanner created");

    console.log(`About to call discover with rootDir: ${tempDir}`);
    const result = await scanner.discover({ rootDir: tempDir });
    console.log(`Discover completed`);

    console.log("Discovery result:");
    console.log(`Components found: ${result.components.length}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Stats:`, result.stats);

    if (result.errors.length > 0) {
      console.log("Errors:", result.errors);
    }

    if (result.components.length > 0) {
      console.log("Components:", result.components);
    }
  } finally {
    // Clean up
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

testScanner().catch(console.error);
