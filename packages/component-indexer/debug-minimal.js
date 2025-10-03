import fs from "fs";
import path from "path";
import os from "os";
import { ComponentScanner } from "./dist/scanner.js";

async function testMinimal() {
  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "minimal-test-")
  );

  try {
    // Create a minimal component file
    const componentFile = path.join(tempDir, "Test.tsx");
    await fs.promises.writeFile(
      componentFile,
      `
export function Test() {
  return <div>Hello</div>;
}
    `.trim()
    );

    console.log(`Created minimal test file: ${componentFile}`);

    const scanner = new ComponentScanner();
    console.log("Scanner created");

    // Override console.log to capture output
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog("[DEBUG]", ...args);
    };

    const result = await scanner.discover({ rootDir: tempDir });

    console.log = originalLog; // Restore

    console.log("Result:", {
      components: result.components.length,
      errors: result.errors,
      stats: result.stats,
      componentDetails: result.components,
    });
  } catch (error) {
    console.error("Error:", error);
    console.error("Stack:", error.stack);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

testMinimal();
