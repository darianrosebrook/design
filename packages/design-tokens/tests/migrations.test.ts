/**
 * @fileoverview Tests for token schema migrations
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  detectVersion,
  needsMigration,
  migrateTokens,
  autoMigrate,
  isSupportedVersion,
  getSupportedVersions,
  checkCompatibility,
  CURRENT_VERSION,
} from "../src/migrations";

describe("Token Schema Migrations", () => {
  describe("Version Detection", () => {
    it("should detect version from version field", () => {
      const tokens = { version: "1.0.0", color: {} };
      expect(detectVersion(tokens)).toBe("1.0.0");
    });

    it("should detect version from schemaVersion field (legacy)", () => {
      const tokens = { schemaVersion: "0.1.0", color: {} };
      expect(detectVersion(tokens)).toBe("0.1.0");
    });

    it("should infer 0.1.0 for tokens without version fields", () => {
      const tokens = { color: {}, space: {} };
      expect(detectVersion(tokens)).toBe("0.1.0");
    });

    it("should return undefined for unknown structure", () => {
      const tokens = { invalid: "structure" };
      expect(detectVersion(tokens)).toBeUndefined();
    });

    it("should prefer version over schemaVersion", () => {
      const tokens = { version: "1.0.0", schemaVersion: "0.1.0", color: {} };
      expect(detectVersion(tokens)).toBe("1.0.0");
    });
  });

  describe("Migration Detection", () => {
    it("should detect when migration is needed", () => {
      const tokens = { schemaVersion: "0.1.0", color: {} };
      expect(needsMigration(tokens)).toBe(true);
    });

    it("should detect when migration is not needed", () => {
      const tokens = { version: CURRENT_VERSION, color: {} };
      expect(needsMigration(tokens)).toBe(false);
    });
  });

  describe("Migration: 0.1.0 -> 1.0.0", () => {
    it("should migrate from 0.1.0 to 1.0.0", () => {
      const tokens = {
        schemaVersion: "0.1.0",
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
        space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 },
        type: {
          family: { sans: "Inter, sans-serif", mono: "Monaco, monospace" },
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
          lineHeight: { tight: 1.25, normal: 1.5, loose: 1.75 },
        },
        radius: { none: 0, sm: 4, md: 6, lg: 8, xl: 12, full: 9999 },
        shadow: {
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
        borderWidth: { none: 0, sm: 1, md: 2, lg: 4 },
        zIndex: {
          dropdown: 1000,
          sticky: 1020,
          fixed: 1030,
          modal: 1040,
          popover: 1050,
          tooltip: 1060,
        },
      };

      const result = migrateTokens(tokens, "1.0.0");

      expect(result.success).toBe(true);
      expect(result.fromVersion).toBe("0.1.0");
      expect(result.toVersion).toBe("1.0.0");
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.schemaVersion).toBeUndefined(); // Removed
      expect(result.tokens?.$schema).toBe(
        "https://paths.design/schemas/design-tokens/1.0.0.json"
      );
      // Tokens structure preserved
      expect(result.tokens?.color.background.primary).toBe("#0B0B0B");
    });

    it("should add $schema if missing", () => {
      const tokens = { schemaVersion: "0.1.0", color: {} };
      const result = migrateTokens(tokens, "1.0.0");

      expect(result.success).toBe(true);
      expect(result.tokens?.$schema).toBe(
        "https://paths.design/schemas/design-tokens/1.0.0.json"
      );
    });

    it("should preserve existing $schema", () => {
      const tokens = {
        $schema: "https://custom.com/schema.json",
        schemaVersion: "0.1.0",
        color: {},
      };
      const result = migrateTokens(tokens, "1.0.0");

      expect(result.success).toBe(true);
      expect(result.tokens?.$schema).toBe("https://custom.com/schema.json");
    });
  });

  describe("Auto-Migration", () => {
    it("should auto-migrate to latest version", () => {
      const tokens = { schemaVersion: "0.1.0", color: {} };
      const result = autoMigrate(tokens);

      expect(result.success).toBe(true);
      expect(result.toVersion).toBe(CURRENT_VERSION);
    });

    it("should return success if already at latest version", () => {
      const tokens = { version: CURRENT_VERSION, color: {} };
      const result = autoMigrate(tokens);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        "Tokens already at target version, no migration needed"
      );
    });
  });

  describe("Version Support", () => {
    it("should check if version is supported", () => {
      expect(isSupportedVersion("0.1.0")).toBe(true);
      expect(isSupportedVersion("1.0.0")).toBe(true);
      expect(isSupportedVersion("2.0.0")).toBe(false);
      expect(isSupportedVersion("invalid")).toBe(false);
    });

    it("should return all supported versions", () => {
      const versions = getSupportedVersions();
      expect(versions).toContain("0.1.0");
      expect(versions).toContain("1.0.0");
    });
  });

  describe("Compatibility Check", () => {
    it("should report compatibility for current version", () => {
      const tokens = { version: "1.0.0", color: {} };
      const report = checkCompatibility(tokens);

      expect(report.version).toBe("1.0.0");
      expect(report.isSupported).toBe(true);
      expect(report.isCurrent).toBe(true);
      expect(report.needsMigration).toBe(false);
      expect(report.canMigrate).toBe(false);
      expect(report.warnings).toHaveLength(0);
    });

    it("should report compatibility for old version", () => {
      const tokens = { schemaVersion: "0.1.0", color: {} };
      const report = checkCompatibility(tokens);

      expect(report.version).toBe("0.1.0");
      expect(report.isSupported).toBe(true);
      expect(report.isCurrent).toBe(false);
      expect(report.needsMigration).toBe(true);
      expect(report.canMigrate).toBe(true);
      expect(report.migrationPath).toEqual(["0.1.0->1.0.0"]);
    });

    it("should report compatibility for unknown version", () => {
      const tokens = { invalid: "structure" };
      const report = checkCompatibility(tokens);

      expect(report.version).toBeUndefined();
      expect(report.isSupported).toBe(false);
      expect(report.isCurrent).toBe(false);
      expect(report.needsMigration).toBe(true);
      expect(report.canMigrate).toBe(false);
      expect(report.warnings).toContain("Unable to detect schema version");
    });

    it("should report compatibility for unsupported version", () => {
      const tokens = { version: "99.0.0", color: {} };
      const report = checkCompatibility(tokens);

      expect(report.version).toBe("99.0.0");
      expect(report.isSupported).toBe(false);
      expect(report.isCurrent).toBe(false);
      expect(report.needsMigration).toBe(true);
      expect(report.canMigrate).toBe(false);
      expect(report.warnings).toContain("Version 99.0.0 is not supported");
    });
  });

  describe("Error Handling", () => {
    it("should fail gracefully for unknown source version", () => {
      const tokens = { invalid: "structure" };
      const result = migrateTokens(tokens, "1.0.0");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unable to detect token schema version");
    });

    it("should fail gracefully for unsupported migration path", () => {
      const tokens = { version: "99.0.0", color: {} };
      const result = migrateTokens(tokens, "1.0.0");

      expect(result.success).toBe(false);
      expect(result.error).toContain("No migration path");
    });
  });
});
