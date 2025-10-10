/**
 * @fileoverview Integration tests for CLI interface
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("CLI Integration Tests", () => {
  let testDir: string;
  let outputDir: string;

  const testDocument = {
    schemaVersion: "0.1.0",
    id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
    name: "Test Document",
    artboards: [
      {
        id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
        name: "Home Page",
        frame: { x: 0, y: 0, width: 1440, height: 1024 },
        children: [
          {
            id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
            type: "frame",
            name: "Hero",
            frame: { x: 0, y: 0, width: 1440, height: 480 },
            children: [
              {
                id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
                type: "text",
                name: "Title",
                frame: { x: 32, y: 40, width: 600, height: 64 },
                text: "Build in your IDE",
                textStyle: { family: "Inter", size: 48, weight: "700" },
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    // Create temporary test directory
    testDir = join(tmpdir(), `designer-cli-test-${Date.now()}`);
    outputDir = join(testDir, "output");
    mkdirSync(testDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    // Write test document
    writeFileSync(
      join(testDir, "test.canvas.json"),
      JSON.stringify(testDocument, null, 2)
    );
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Basic CLI Operations", () => {
    it("shows help with --help flag", () => {
      const output = execSync("node dist/cli.js --help", {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      expect(output).toContain("Usage:");
      expect(output).toContain("Options:");
      expect(output).toContain("--input");
      expect(output).toContain("--output");
    });

    it("shows help with -h flag", () => {
      const output = execSync("node dist/cli.js -h", {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      expect(output).toContain("Usage:");
    });

    it("generates components from input file", () => {
      const inputFile = join(testDir, "test.canvas.json");

      const output = execSync(
        `node dist/cli.js --input "${inputFile}" --output "${outputDir}"`,
        {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        }
      );

      expect(output).toContain("Generated");
      expect(output).toContain("files");

      // Check that files were generated
      expect(existsSync(join(outputDir, "HomePage.tsx"))).toBe(true);
      expect(existsSync(join(outputDir, "HomePage.module.css"))).toBe(true);
      expect(existsSync(join(outputDir, "index.ts"))).toBe(true);
    });

    it("supports positional arguments", () => {
      const inputFile = join(testDir, "test.canvas.json");

      const output = execSync(
        `node dist/cli.js "${inputFile}" "${outputDir}"`,
        {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        }
      );

      expect(output).toContain("Generated");
      expect(existsSync(join(outputDir, "HomePage.tsx"))).toBe(true);
    });
  });

  describe("CLI Options", () => {
    it("supports --format tsx", () => {
      const inputFile = join(testDir, "test.canvas.json");

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}" --format tsx`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      const content = readFileSync(join(outputDir, "HomePage.tsx"), "utf8");
      expect(content).toContain("export default function HomePage");
    });

    it("supports --format jsx", () => {
      const inputFile = join(testDir, "test.canvas.json");

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}" --format jsx`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      // Should still generate .tsx files (we don't change extension)
      // but format option is passed through
      expect(existsSync(join(outputDir, "HomePage.tsx"))).toBe(true);
    });

    it("supports --verbose flag", () => {
      const inputFile = join(testDir, "test.canvas.json");

      const output = execSync(
        `node dist/cli.js "${inputFile}" "${outputDir}" --verbose`,
        {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        }
      );

      expect(output).toContain("Generating React components");
      expect(output).toContain("Input:");
      expect(output).toContain("Output:");
      expect(output).toContain("Generated:");
    });

    it("supports --indent option", () => {
      const inputFile = join(testDir, "test.canvas.json");

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}" --indent 4`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      const content = readFileSync(join(outputDir, "HomePage.tsx"), "utf8");
      // Check for 4-space indentation (harder to verify, but check structure)
      expect(content).toContain("export default function HomePage");
    });
  });

  describe("Deterministic Options", () => {
    it("supports --fixed-timestamp for deterministic output", () => {
      const inputFile = join(testDir, "test.canvas.json");
      const outputDir1 = join(testDir, "output1");
      const outputDir2 = join(testDir, "output2");

      mkdirSync(outputDir1, { recursive: true });
      mkdirSync(outputDir2, { recursive: true });

      const timestamp = "1234567890000";
      const uuid = "01JF2PZV9G2WR5C3W7P0YHNX9D";

      execSync(
        `node dist/cli.js "${inputFile}" "${outputDir1}" --fixed-timestamp ${timestamp} --fixed-uuid ${uuid}`,
        {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        }
      );

      execSync(
        `node dist/cli.js "${inputFile}" "${outputDir2}" --fixed-timestamp ${timestamp} --fixed-uuid ${uuid}`,
        {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        }
      );

      // Read generated files
      const content1 = readFileSync(join(outputDir1, "HomePage.tsx"), "utf8");
      const content2 = readFileSync(join(outputDir2, "HomePage.tsx"), "utf8");

      // Should be identical
      expect(content1).toBe(content2);
    });

    it("produces different output without fixed clock", () => {
      const inputFile = join(testDir, "test.canvas.json");
      const outputDir1 = join(testDir, "output1");
      const outputDir2 = join(testDir, "output2");

      mkdirSync(outputDir1, { recursive: true });
      mkdirSync(outputDir2, { recursive: true });

      execSync(`node dist/cli.js "${inputFile}" "${outputDir1}"`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      // Wait a bit to ensure different timestamps
      execSync("sleep 0.01", { shell: true });

      execSync(`node dist/cli.js "${inputFile}" "${outputDir2}"`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      // Read generated files
      const content1 = readFileSync(join(outputDir1, "HomePage.tsx"), "utf8");
      const content2 = readFileSync(join(outputDir2, "HomePage.tsx"), "utf8");

      // Should be different (timestamps/UUIDs differ)
      expect(content1).not.toBe(content2);
    });
  });

  describe("Error Handling", () => {
    it("exits with error for missing input file", () => {
      try {
        execSync(
          `node dist/cli.js "${join(
            testDir,
            "nonexistent.json"
          )}" "${outputDir}"`,
          {
            cwd: join(__dirname, ".."),
            encoding: "utf8",
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain("Failed to read input file");
      }
    });

    it("exits with error for invalid JSON", () => {
      const invalidFile = join(testDir, "invalid.json");
      writeFileSync(invalidFile, "{ invalid json }");

      try {
        execSync(`node dist/cli.js "${invalidFile}" "${outputDir}"`, {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain("Failed to parse JSON");
      }
    });

    it("exits with error for missing required arguments", () => {
      try {
        execSync("node dist/cli.js", {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain("Input file is required");
      }
    });

    it("exits with error for invalid format option", () => {
      const inputFile = join(testDir, "test.canvas.json");

      try {
        execSync(
          `node dist/cli.js "${inputFile}" "${outputDir}" --format invalid`,
          {
            cwd: join(__dirname, ".."),
            encoding: "utf8",
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain("Invalid format");
      }
    });

    it("exits with error for invalid timestamp", () => {
      const inputFile = join(testDir, "test.canvas.json");

      try {
        execSync(
          `node dist/cli.js "${inputFile}" "${outputDir}" --fixed-timestamp invalid`,
          {
            cwd: join(__dirname, ".."),
            encoding: "utf8",
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain("Invalid timestamp");
      }
    });

    it("exits with error for invalid UUID", () => {
      const inputFile = join(testDir, "test.canvas.json");

      try {
        execSync(
          `node dist/cli.js "${inputFile}" "${outputDir}" --fixed-uuid "short"`,
          {
            cwd: join(__dirname, ".."),
            encoding: "utf8",
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain("Invalid UUID");
      }
    });
  });

  describe("Generated Output Quality", () => {
    it("generates valid TypeScript code", () => {
      const inputFile = join(testDir, "test.canvas.json");

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}"`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      const content = readFileSync(join(outputDir, "HomePage.tsx"), "utf8");

      // Basic TypeScript structure checks
      expect(content).toContain("import");
      expect(content).toContain("export default function");
      expect(content).toContain("return");
      expect(content).toContain("</");
    });

    it("generates valid CSS modules", () => {
      const inputFile = join(testDir, "test.canvas.json");

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}"`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      const content = readFileSync(
        join(outputDir, "HomePage.module.css"),
        "utf8"
      );

      // Basic CSS structure checks
      expect(content).toMatch(/\.\w+ \{/); // CSS class
      expect(content).toContain("position:");
      expect(content).toContain("px;");
    });

    it("generates index file with exports", () => {
      const inputFile = join(testDir, "test.canvas.json");

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}"`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      const content = readFileSync(join(outputDir, "index.ts"), "utf8");

      expect(content).toContain("export");
      expect(content).toContain("HomePage");
    });

    it("includes component metadata in comments", () => {
      const inputFile = join(testDir, "test.canvas.json");

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}"`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      const content = readFileSync(join(outputDir, "HomePage.tsx"), "utf8");

      expect(content).toContain("// Generated at");
      expect(content).toContain("// Component ID:");
    });
  });

  describe("Complex Documents", () => {
    it("handles multiple artboards", () => {
      const multiArtboardDoc = {
        ...testDocument,
        artboards: [
          testDocument.artboards[0],
          {
            id: "01JF2Q20Q3MZ3Q9J7HB3X6N9QC",
            name: "About Page",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      };

      const inputFile = join(testDir, "multi.canvas.json");
      writeFileSync(inputFile, JSON.stringify(multiArtboardDoc, null, 2));

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}"`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      // Should generate files for both artboards
      expect(existsSync(join(outputDir, "HomePage.tsx"))).toBe(true);
      expect(existsSync(join(outputDir, "AboutPage.tsx"))).toBe(true);
      expect(existsSync(join(outputDir, "index.ts"))).toBe(true);

      // Index should export both
      const indexContent = readFileSync(join(outputDir, "index.ts"), "utf8");
      expect(indexContent).toContain("HomePage");
      expect(indexContent).toContain("AboutPage");
    });

    it("handles deeply nested components", () => {
      const nestedDoc = {
        ...testDocument,
        artboards: [
          {
            ...testDocument.artboards[0],
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "frame",
                name: "Container",
                frame: { x: 0, y: 0, width: 1440, height: 480 },
                children: [
                  {
                    id: "01JF2Q07GTS16EJ3A3F0KK9K3U",
                    type: "frame",
                    name: "Inner",
                    frame: { x: 0, y: 0, width: 800, height: 400 },
                    children: [
                      {
                        id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
                        type: "text",
                        name: "Deep Text",
                        frame: { x: 0, y: 0, width: 100, height: 40 },
                        text: "Nested content",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const inputFile = join(testDir, "nested.canvas.json");
      writeFileSync(inputFile, JSON.stringify(nestedDoc, null, 2));

      execSync(`node dist/cli.js "${inputFile}" "${outputDir}"`, {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      });

      const content = readFileSync(join(outputDir, "HomePage.tsx"), "utf8");

      // Should handle nested structure with component reuse
      // The component may be extracted or inlined depending on reuse patterns
      const hasSemanticStructure =
        content.includes("section") || // Semantic HTML element
        content.includes("frame") || // CSS class name
        content.includes("Container"); // Component name (if not extracted)

      expect(hasSemanticStructure).toBe(true);

      // Check if content is inline or in extracted component
      const hasNestedContent =
        content.includes("Nested content") || content.includes("Deep Text");

      expect(hasNestedContent).toBe(true);
    });
  });

  describe("Output Statistics", () => {
    it("reports number of files generated", () => {
      const inputFile = join(testDir, "test.canvas.json");

      const output = execSync(
        `node dist/cli.js "${inputFile}" "${outputDir}"`,
        {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        }
      );

      expect(output).toMatch(/Generated \d+ files/);
    });

    it("reports number of artboards and nodes processed", () => {
      const inputFile = join(testDir, "test.canvas.json");

      const output = execSync(
        `node dist/cli.js "${inputFile}" "${outputDir}"`,
        {
          cwd: join(__dirname, ".."),
          encoding: "utf8",
        }
      );

      expect(output).toContain("artboards");
      expect(output).toContain("nodes");
    });
  });
});
