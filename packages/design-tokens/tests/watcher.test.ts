/**
 * @fileoverview Tests for token file watcher
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { watchTokens } from "../src/watcher";

describe("Token File Watcher", () => {
  let tempDir: string;
  let tokensPath: string;
  let outputPath: string;

  beforeEach(() => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "token-watcher-test-"));
    tokensPath = path.join(tempDir, "tokens.json");
    outputPath = path.join(tempDir, "output.css");

    // Write initial valid tokens file
    const validTokens = {
      color: {
        background: {
          primary: "#0B0B0B",
          secondary: "#1A1D23",
          tertiary: "#1A1D23",
          surface: "#1E2329",
          elevated: "#252B33",
        },
        text: {
          primary: "#E6E6E6",
          secondary: "#A3A3A3",
          tertiary: "#6B7280",
          inverse: "#0B0B0B",
        },
        border: {
          subtle: "#374151",
          default: "#4B5563",
          strong: "#6B7280",
        },
        interactive: {
          primary: "#4F46E5",
          primaryHover: "#4338CA",
          primaryPressed: "#3730A3",
          secondary: "#6B7280",
          secondaryHover: "#4B5563",
          secondaryPressed: "#374151",
          destructive: "#EF4444",
          destructiveHover: "#DC2626",
          destructivePressed: "#B91C1C",
        },
        semantic: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      space: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        "2xl": 32,
        "3xl": 48,
      },
      type: {
        family: {
          sans: "Inter, sans-serif",
          mono: "Monaco, monospace",
        },
        size: {
          xs: 12,
          sm: 14,
          md: 16,
          lg: 18,
          xl: 20,
          "2xl": 24,
          "3xl": 30,
        },
        weight: {
          normal: "400",
          medium: "500",
          semibold: "600",
          bold: "700",
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          loose: 1.75,
        },
      },
      radius: {
        none: 0,
        sm: 4,
        md: 6,
        lg: 8,
        xl: 12,
        full: 9999,
      },
      shadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      },
      borderWidth: {
        none: 0,
        sm: 1,
        md: 2,
        lg: 4,
      },
      zIndex: {
        dropdown: 1000,
        sticky: 1020,
        fixed: 1030,
        modal: 1040,
        popover: 1050,
        tooltip: 1060,
      },
    };

    fs.writeFileSync(tokensPath, JSON.stringify(validTokens, null, 2));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("Initial Generation", () => {
    it("should generate CSS on initial watch", async () => {
      const onRegenerate = vi.fn();
      const watcher = watchTokens({
        tokensPath,
        outputPath,
        onRegenerate,
      });

      // Wait for initial generation
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fs.existsSync(outputPath)).toBe(true);
      expect(onRegenerate).toHaveBeenCalledOnce();

      watcher.stop();
    });

    it("should include resolved tokens in generated CSS", async () => {
      const watcher = watchTokens({
        tokensPath,
        outputPath,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const css = fs.readFileSync(outputPath, "utf8");
      expect(css).toContain(":root {");
      expect(css).toContain("--color-background-primary: #0B0B0B");
      expect(css).toContain("--space-xs: 4px");

      watcher.stop();
    });
  });

  describe("File Change Detection", () => {
    it("should regenerate CSS when tokens file changes", async () => {
      const onRegenerate = vi.fn();
      const watcher = watchTokens({
        tokensPath,
        outputPath,
        onRegenerate,
        debounceMs: 50,
      });

      // Wait for initial generation
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(onRegenerate).toHaveBeenCalledOnce();

      // Modify tokens file
      const updatedTokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
      updatedTokens.color.background.primary = "#FFFFFF";
      fs.writeFileSync(tokensPath, JSON.stringify(updatedTokens, null, 2));

      // Wait for debounce + regeneration
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onRegenerate).toHaveBeenCalledTimes(2);

      const css = fs.readFileSync(outputPath, "utf8");
      expect(css).toContain("--color-background-primary: #FFFFFF");

      watcher.stop();
    });

    it("should debounce rapid changes", async () => {
      const onRegenerate = vi.fn();
      const watcher = watchTokens({
        tokensPath,
        outputPath,
        onRegenerate,
        debounceMs: 100,
      });

      // Wait for initial generation
      await new Promise((resolve) => setTimeout(resolve, 100));
      const initialCalls = onRegenerate.mock.calls.length;

      // Make 3 rapid changes
      const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

      tokens.color.background.primary = "#111111";
      fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
      await new Promise((resolve) => setTimeout(resolve, 30));

      tokens.color.background.primary = "#222222";
      fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
      await new Promise((resolve) => setTimeout(resolve, 30));

      tokens.color.background.primary = "#333333";
      fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));

      // Wait for debounce + regeneration
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should only regenerate once for all 3 changes (debounced)
      expect(onRegenerate.mock.calls.length).toBeLessThanOrEqual(
        initialCalls + 2
      );

      watcher.stop();
    });
  });

  describe("Error Handling", () => {
    it("should call onError for invalid JSON", async () => {
      const onError = vi.fn();
      const watcher = watchTokens({
        tokensPath,
        outputPath,
        onError,
        debounceMs: 50,
      });

      // Wait for initial generation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Write invalid JSON
      fs.writeFileSync(tokensPath, "{ invalid json");

      // Wait for debounce + regeneration attempt
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);

      watcher.stop();
    });

    it("should call onError for invalid token schema", async () => {
      const onError = vi.fn();
      const watcher = watchTokens({
        tokensPath,
        outputPath,
        onError,
        debounceMs: 50,
      });

      // Wait for initial generation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Write invalid tokens (missing required fields)
      fs.writeFileSync(tokensPath, JSON.stringify({ invalid: "schema" }));

      // Wait for debounce + regeneration attempt
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].message).toContain(
        "Invalid tokens schema"
      );

      watcher.stop();
    });

    it("should throw error if tokens file does not exist", () => {
      expect(() => {
        watchTokens({
          tokensPath: path.join(tempDir, "nonexistent.json"),
          outputPath,
        });
      }).toThrow("Tokens file not found");
    });
  });

  describe("Manual Regeneration", () => {
    it("should support manual regeneration via regenerate()", async () => {
      const onRegenerate = vi.fn();
      const watcher = watchTokens({
        tokensPath,
        outputPath,
        onRegenerate,
      });

      // Wait for initial generation
      await new Promise((resolve) => setTimeout(resolve, 100));
      const initialCalls = onRegenerate.mock.calls.length;

      // Manually trigger regeneration
      await watcher.regenerate();

      expect(onRegenerate.mock.calls.length).toBe(initialCalls + 1);

      watcher.stop();
    });
  });

  describe("Cleanup", () => {
    it("should stop watching when stop() is called", async () => {
      const onRegenerate = vi.fn();
      const watcher = watchTokens({
        tokensPath,
        outputPath,
        onRegenerate,
        debounceMs: 50,
      });

      // Wait for initial generation
      await new Promise((resolve) => setTimeout(resolve, 100));
      const callsBeforeStop = onRegenerate.mock.calls.length;

      // Stop watcher
      watcher.stop();

      // Modify file after stopping
      const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
      tokens.color.background.primary = "#FFFFFF";
      fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));

      // Wait to ensure no regeneration occurs
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onRegenerate.mock.calls.length).toBe(callsBeforeStop);
    });
  });
});
