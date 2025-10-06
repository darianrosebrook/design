/**
 * Data integrity and backup system for design system components
 * @author @darianrosebrook
 *
 * Ensures data consistency, provides backup/restore capabilities, and
 * validates component data integrity:
 * - Component data validation and checksums
 * - Automatic backup creation and versioning
 * - Data corruption detection and repair
 * - Migration support for data format changes
 */

import type { IngestedComponent } from "./dynamic-component-registry";
import { getDesignSystemMonitor } from "./monitoring";

/**
 * Data integrity check result
 */
export interface IntegrityCheckResult {
  isValid: boolean;
  issues: IntegrityIssue[];
  checksum: string;
  timestamp: number;
}

/**
 * Data integrity issue
 */
export interface IntegrityIssue {
  type: "missing" | "corrupted" | "inconsistent" | "orphaned";
  severity: "low" | "medium" | "high" | "critical";
  componentId?: string;
  message: string;
  suggestion?: string;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  id: string;
  timestamp: number;
  version: string;
  componentCount: number;
  checksum: string;
  size: number;
  reason?: string;
}

/**
 * Backup data structure
 */
export interface BackupData {
  metadata: BackupMetadata;
  components: Record<string, IngestedComponent>;
  systemState: {
    version: string;
    schemaVersion: string;
    checksum: string;
  };
}

/**
 * Data integrity manager
 */
export class DataIntegrityManager {
  private backups: Map<string, BackupData> = new Map();
  private lastIntegrityCheck = 0;
  private integrityCheckInterval = 60 * 60 * 1000; // 1 hour

  /**
   * Validate component data integrity
   */
  async validateComponents(
    components: Map<string, IngestedComponent>
  ): Promise<IntegrityCheckResult> {
    const issues: IntegrityIssue[] = [];
    const monitor = getDesignSystemMonitor();

    // Check for missing required fields
    for (const [id, component] of components) {
      if (!component.id || !component.name || !component.component) {
        issues.push({
          type: "missing",
          severity: "critical",
          componentId: id,
          message: "Component missing required fields",
          suggestion: "Re-ingest or repair component data",
        });
      }

      // Check for data consistency
      if (component.id !== id) {
        issues.push({
          type: "inconsistent",
          severity: "high",
          componentId: id,
          message: "Component ID mismatch",
          suggestion: "Fix component ID consistency",
        });
      }

      // Check component function validity
      if (typeof component.component !== "function") {
        issues.push({
          type: "corrupted",
          severity: "critical",
          componentId: id,
          message: "Component is not a valid React component",
          suggestion: "Re-ingest component",
        });
      }

      // Check metadata consistency
      if (component.lastUpdated && component.lastUpdated > Date.now() + 1000) {
        issues.push({
          type: "inconsistent",
          severity: "medium",
          componentId: id,
          message: "Component has future lastUpdated timestamp",
          suggestion: "Update timestamp to current time",
        });
      }
    }

    // Check for orphaned cache entries
    // This would require access to cache manager - simplified for now

    const isValid =
      issues.filter((i) => i.severity === "critical").length === 0;
    const checksum = this.generateChecksum(components);

    monitor.recordMetric("integrity_check", "gauge", isValid ? 1 : 0, {
      componentCount: components.size.toString(),
      issuesFound: issues.length.toString(),
    });

    return {
      isValid,
      issues,
      checksum,
      timestamp: Date.now(),
    };
  }

  /**
   * Create a backup of component data
   */
  async createBackup(
    components: Map<string, IngestedComponent>,
    reason?: string
  ): Promise<BackupData> {
    const componentsData = Object.fromEntries(components);
    const checksum = this.generateChecksum(components);

    const backup: BackupData = {
      metadata: {
        id: this.generateBackupId(),
        timestamp: Date.now(),
        version: "1.0.0",
        componentCount: components.size,
        checksum,
        size: this.calculateDataSize(componentsData),
        reason,
      },
      components: componentsData,
      systemState: {
        version: process.env.npm_package_version || "1.0.0",
        schemaVersion: "1.0",
        checksum,
      },
    };

    this.backups.set(backup.metadata.id, backup);

    // Keep only last 10 backups
    if (this.backups.size > 10) {
      const oldestKey = Array.from(this.backups.keys())[0];
      this.backups.delete(oldestKey);
    }

    console.log(
      `Created backup ${backup.metadata.id} with ${components.size} components`
    );

    return backup;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(
    backupId: string
  ): Promise<Map<string, IngestedComponent> | null> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      console.error(`Backup ${backupId} not found`);
      return null;
    }

    // Validate backup integrity
    const currentChecksum = this.generateChecksum(
      new Map(Object.entries(backup.components))
    );
    if (currentChecksum !== backup.metadata.checksum) {
      console.error(`Backup ${backupId} is corrupted - checksum mismatch`);
      return null;
    }

    console.log(
      `Restoring from backup ${backupId} (${backup.metadata.componentCount} components)`
    );
    return new Map(Object.entries(backup.components));
  }

  /**
   * List available backups
   */
  listBackups(): BackupMetadata[] {
    return Array.from(this.backups.values())
      .map((b) => b.metadata)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clean up old backups
   */
  cleanupOldBackups(maxAgeDays = 30): void {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    for (const [id, backup] of this.backups) {
      if (backup.metadata.timestamp < cutoff) {
        this.backups.delete(id);
        console.log(`Cleaned up old backup: ${id}`);
      }
    }
  }

  /**
   * Detect and repair data corruption
   */
  async detectAndRepair(
    components: Map<string, IngestedComponent>
  ): Promise<{ repaired: boolean; issues: IntegrityIssue[] }> {
    const integrityResult = await this.validateComponents(components);

    if (integrityResult.isValid) {
      return { repaired: false, issues: [] };
    }

    const repairableIssues = integrityResult.issues.filter(
      (issue) => issue.severity !== "critical" && issue.suggestion
    );

    let repaired = false;

    for (const issue of repairableIssues) {
      if (issue.type === "inconsistent" && issue.componentId) {
        const component = components.get(issue.componentId);
        if (component && issue.message.includes("future lastUpdated")) {
          // Fix future timestamp
          component.lastUpdated = Date.now();
          repaired = true;
          console.log(`Repaired timestamp for component ${issue.componentId}`);
        }
      }
    }

    // For critical issues, we can't auto-repair
    const criticalIssues = integrityResult.issues.filter(
      (i) => i.severity === "critical"
    );

    return { repaired, issues: criticalIssues };
  }

  /**
   * Export backup data for external storage
   */
  exportBackup(backupId: string): string | null {
    const backup = this.backups.get(backupId);
    if (!backup) return null;

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Import backup data from external source
   */
  async importBackup(backupJson: string): Promise<boolean> {
    try {
      const backup: BackupData = JSON.parse(backupJson);

      // Validate backup structure
      if (!backup.metadata || !backup.components || !backup.systemState) {
        console.error("Invalid backup format");
        return false;
      }

      // Validate checksum
      const calculatedChecksum = this.generateChecksum(
        new Map(Object.entries(backup.components))
      );
      if (calculatedChecksum !== backup.metadata.checksum) {
        console.error("Backup checksum validation failed");
        return false;
      }

      this.backups.set(backup.metadata.id, backup);
      console.log(`Imported backup ${backup.metadata.id}`);

      return true;
    } catch (error) {
      console.error("Failed to import backup:", error);
      return false;
    }
  }

  /**
   * Get data migration suggestions
   */
  getMigrationSuggestions(
    currentVersion: string,
    targetVersion: string
  ): string[] {
    const suggestions: string[] = [];

    // Version-specific migration advice
    if (currentVersion === "0.1.0" && targetVersion === "1.0.0") {
      suggestions.push("Backup all component data before migration");
      suggestions.push("Update component validation rules");
      suggestions.push("Migrate component metadata format");
    }

    suggestions.push("Create backup before any data migration");
    suggestions.push("Test migration on subset of data first");
    suggestions.push("Validate component integrity after migration");

    return suggestions;
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(components: Map<string, IngestedComponent>): string {
    const data = Array.from(components.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, component]) => ({
        id,
        name: component.name,
        source: component.source,
        version: component.version,
        lastUpdated: component.lastUpdated,
      }));

    const crypto = require("crypto");
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
  }

  /**
   * Calculate approximate data size
   */
  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `backup_${timestamp}_${random}`;
  }

  /**
   * Periodic integrity check
   */
  async performPeriodicIntegrityCheck(
    components: Map<string, IngestedComponent>
  ): Promise<void> {
    const now = Date.now();
    if (now - this.lastIntegrityCheck < this.integrityCheckInterval) {
      return; // Not time for check yet
    }

    this.lastIntegrityCheck = now;

    const result = await this.validateComponents(components);
    if (!result.isValid) {
      console.warn(
        `Data integrity check failed: ${result.issues.length} issues found`
      );

      // Auto-repair what we can
      const repairResult = await this.detectAndRepair(components);
      if (repairResult.repaired) {
        console.log("Automatically repaired some data integrity issues");
      }

      // For critical issues, create backup and alert
      const criticalIssues = result.issues.filter(
        (i) => i.severity === "critical"
      );
      if (criticalIssues.length > 0) {
        console.error(
          `${criticalIssues.length} critical data integrity issues detected`
        );
        // In a real system, this would trigger alerts/notifications
      }
    } else {
      console.log("Data integrity check passed");
    }
  }
}

/**
 * Global data integrity manager instance
 */
let globalIntegrityManager: DataIntegrityManager | null = null;

/**
 * Get global data integrity manager
 */
export function getDataIntegrityManager(): DataIntegrityManager {
  if (!globalIntegrityManager) {
    globalIntegrityManager = new DataIntegrityManager();
  }
  return globalIntegrityManager;
}

/**
 * Reset global integrity manager (for testing)
 */
export function resetDataIntegrityManager(): void {
  if (globalIntegrityManager) {
    globalIntegrityManager = null;
  }
}

/**
 * Create automatic backup on component changes
 */
export async function createAutomaticBackup(
  components: Map<string, IngestedComponent>,
  reason: string = "automatic"
): Promise<void> {
  const integrityManager = getDataIntegrityManager();
  await integrityManager.createBackup(components, reason);
}

/**
 * Validate component data integrity
 */
export async function validateComponentIntegrity(
  components: Map<string, IngestedComponent>
): Promise<IntegrityCheckResult> {
  const integrityManager = getDataIntegrityManager();
  return integrityManager.validateComponents(components);
}
