import fs from "fs";
import path from "path";
import os from "os";
import { ComponentScanner } from "./src/scanner.js";

console.log("Testing scanner with props...");

async function testPropsScanner() {
  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "component-scanner-")
  );

  try {
    // Create a test component file with inline props
    const componentFile = path.join(tempDir, "Button.tsx");
    await fs.promises.writeFile(
      componentFile,
      `export function Button(props: { label: string; onClick: () => void; disabled?: boolean }): JSX.Element {
  return <button onClick={props.onClick} disabled={props.disabled}>
    {props.label}
  </button>;
}`
    );

    console.log(`Created test file: ${componentFile}`);
    console.log(`File exists: ${fs.existsSync(componentFile)}`);

    // Test the scanner
    const scanner = new ComponentScanner();
    console.log("Scanner created");

    const result = await scanner.discover({ rootDir: tempDir });

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

testPropsScanner().catch(console.error);
