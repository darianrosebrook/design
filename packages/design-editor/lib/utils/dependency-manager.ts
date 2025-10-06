/**
 * Dependency management and versioning system for design system components
 * @author @darianrosebrook
 *
 * Manages component dependencies, versions, and compatibility:
 * - Version resolution and conflict detection
 * - Dependency graph analysis
 * - Breaking change detection
 * - Semantic versioning compliance
 * - Migration path suggestions
 */

import type { IngestedComponent } from "./dynamic-component-registry";
import semver from "semver";

/**
 * Version constraint types
 */
export enum VersionConstraint {
  EXACT = "exact",
  COMPATIBLE = "compatible",
  MINIMUM = "minimum",
  LATEST = "latest",
}

/**
 * Dependency relationship types
 */
export enum DependencyType {
  REQUIRES = "requires",
  OPTIONAL = "optional",
  CONFLICTS = "conflicts",
  REPLACES = "replaces",
}

/**
 * Component version information
 */
export interface ComponentVersion {
  componentId: string;
  version: string;
  previousVersion?: string;
  releaseDate: number;
  breaking: boolean;
  changes: string[];
  compatibleVersions: string[];
}

/**
 * Dependency declaration
 */
export interface DependencyDeclaration {
  componentId: string;
  versionConstraint: string;
  type: DependencyType;
  reason?: string;
}

/**
 * Compatibility result
 */
export interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  suggestions: string[];
}

/**
 * Compatibility issue
 */
export interface CompatibilityIssue {
  type:
    | "version_conflict"
    | "missing_dependency"
    | "circular_dependency"
    | "breaking_change";
  severity: "error" | "warning" | "info";
  message: string;
  affectedComponents: string[];
  suggestion?: string;
}

/**
 * Version resolution result
 */
export interface VersionResolutionResult {
  resolved: boolean;
  versions: Map<string, string>;
  conflicts: VersionConflict[];
  alternatives: string[][];
}

/**
 * Version conflict
 */
export interface VersionConflict {
  componentId: string;
  conflictingVersions: string[];
  requesters: string[];
}

/**
 * Dependency graph node
 */
interface DependencyNode {
  id: string;
  version: string;
  dependencies: Map<string, DependencyDeclaration>;
  dependents: Set<string>;
}

/**
 * Dependency manager for component relationships
 */
export class DependencyManager {
  private versionHistory = new Map<string, ComponentVersion[]>();
  private dependencyGraph = new Map<string, DependencyNode>();
  private componentRegistry = new Map<string, IngestedComponent>();

  /**
   * Register a component with its dependencies
   */
  registerComponent(
    component: IngestedComponent,
    dependencies: DependencyDeclaration[] = []
  ): void {
    // Update component registry
    this.componentRegistry.set(component.id, component);

    // Create or update dependency node
    const node: DependencyNode = {
      id: component.id,
      version: component.version || "1.0.0",
      dependencies: new Map(dependencies.map((dep) => [dep.componentId, dep])),
      dependents: new Set(),
    };

    // Update dependents
    for (const dep of dependencies) {
      const depNode = this.dependencyGraph.get(dep.componentId);
      if (depNode) {
        depNode.dependents.add(component.id);
      }
    }

    this.dependencyGraph.set(component.id, node);

    // Record version history
    this.recordVersion(component);
  }

  /**
   * Check compatibility between components
   */
  checkCompatibility(
    componentId: string,
    targetVersion: string,
    existingComponents: Map<string, IngestedComponent>
  ): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const suggestions: string[] = [];

    const component = this.componentRegistry.get(componentId);
    if (!component) {
      return {
        compatible: false,
        issues: [
          {
            type: "missing_dependency",
            severity: "error",
            message: `Component ${componentId} not found`,
            affectedComponents: [componentId],
          },
        ],
        suggestions: ["Ensure component is properly registered"],
      };
    }

    // Check version compatibility with existing components
    for (const [existingId, existingComponent] of existingComponents) {
      if (existingId === componentId) continue;

      const compatibility = this.checkVersionCompatibility(
        componentId,
        targetVersion,
        existingId,
        existingComponent.version || "1.0.0"
      );

      if (!compatibility.compatible) {
        issues.push(...compatibility.issues);
      }
    }

    // Check dependency requirements
    const node = this.dependencyGraph.get(componentId);
    if (node) {
      for (const [depId, dep] of node.dependencies) {
        const depComponent = existingComponents.get(depId);

        if (!depComponent && dep.type === DependencyType.REQUIRES) {
          issues.push({
            type: "missing_dependency",
            severity: "error",
            message: `Required dependency ${depId} is missing`,
            affectedComponents: [componentId, depId],
            suggestion: `Install ${depId} ${dep.versionConstraint}`,
          });
        } else if (depComponent) {
          const versionCheck = this.checkVersionConstraint(
            depComponent.version || "1.0.0",
            dep.versionConstraint
          );

          if (!versionCheck.satisfies) {
            issues.push({
              type: "version_conflict",
              severity: "error",
              message: `Dependency ${depId} version ${depComponent.version} does not satisfy ${dep.versionConstraint}`,
              affectedComponents: [componentId, depId],
              suggestion: `Update ${depId} to version ${versionCheck.suggestion}`,
            });
          }
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(componentId);
    if (circularDeps.length > 0) {
      issues.push({
        type: "circular_dependency",
        severity: "error",
        message: `Circular dependency detected: ${circularDeps.join(" -> ")}`,
        affectedComponents: circularDeps,
        suggestion: "Refactor to break circular dependency",
      });
    }

    // Check for breaking changes
    const breakingChanges = this.detectBreakingChanges(
      componentId,
      targetVersion
    );
    if (breakingChanges.length > 0) {
      issues.push({
        type: "breaking_change",
        severity: "warning",
        message: `Version ${targetVersion} contains breaking changes`,
        affectedComponents: [componentId],
        suggestion: "Review breaking changes and update dependent components",
      });

      suggestions.push("Review breaking changes in release notes");
      suggestions.push(
        "Update dependent components to handle breaking changes"
      );
    }

    const compatible = !issues.some((issue) => issue.severity === "error");

    return {
      compatible,
      issues,
      suggestions,
    };
  }

  /**
   * Resolve version conflicts in a set of components
   */
  resolveVersions(
    components: Map<string, IngestedComponent>
  ): VersionResolutionResult {
    const versions = new Map<string, string>();
    const conflicts: VersionConflict[] = [];
    const alternatives: string[][] = [];

    // First pass: collect all version requirements
    const requirements = new Map<string, Set<string>>();

    for (const component of components.values()) {
      const node = this.dependencyGraph.get(component.id);
      if (node) {
        for (const [depId, dep] of node.dependencies) {
          if (!requirements.has(depId)) {
            requirements.set(depId, new Set());
          }
          requirements.get(depId)!.add(dep.versionConstraint);
        }
      }
    }

    // Resolve versions for each component
    for (const [componentId, versionConstraints] of requirements) {
      const resolvedVersion = this.resolveVersionConstraints(
        componentId,
        Array.from(versionConstraints)
      );

      if (resolvedVersion.conflicts.length > 0) {
        conflicts.push({
          componentId,
          conflictingVersions: resolvedVersion.conflicts,
          requesters: [], // Would need to track which components requested which versions
        });
      } else if (resolvedVersion.version) {
        versions.set(componentId, resolvedVersion.version);
      }

      if (resolvedVersion.alternatives.length > 0) {
        alternatives.push(resolvedVersion.alternatives);
      }
    }

    return {
      resolved: conflicts.length === 0,
      versions,
      conflicts,
      alternatives,
    };
  }

  /**
   * Get migration path suggestions
   */
  getMigrationPath(
    fromVersion: string,
    toVersion: string,
    componentId: string
  ): {
    path: ComponentVersion[];
    breakingChanges: string[];
    migrationSteps: string[];
  } {
    const history = this.versionHistory.get(componentId) || [];
    const path: ComponentVersion[] = [];
    const breakingChanges: string[] = [];
    const migrationSteps: string[] = [];

    // Find versions in the migration path
    const fromSemver = semver.parse(fromVersion);
    const toSemver = semver.parse(toVersion);

    if (!fromSemver || !toSemver) {
      return { path: [], breakingChanges: [], migrationSteps: [] };
    }

    // Get versions between fromVersion and toVersion
    const relevantVersions = history
      .filter(
        (v) =>
          semver.gte(v.version, fromVersion) && semver.lte(v.version, toVersion)
      )
      .sort((a, b) => semver.compare(a.version, b.version));

    for (const version of relevantVersions) {
      path.push(version);

      if (version.breaking) {
        breakingChanges.push(...version.changes);
      }
    }

    // Generate migration steps
    if (breakingChanges.length > 0) {
      migrationSteps.push("Review breaking changes in release notes");
      migrationSteps.push("Update component usage to handle breaking changes");
      migrationSteps.push("Test component integration thoroughly");
      migrationSteps.push("Consider gradual rollout if possible");
    } else {
      migrationSteps.push("Update version constraint in package.json");
      migrationSteps.push("Run tests to ensure compatibility");
      migrationSteps.push("Deploy updated component");
    }

    return {
      path,
      breakingChanges,
      migrationSteps,
    };
  }

  /**
   * Analyze dependency health
   */
  analyzeDependencyHealth(): {
    healthScore: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let healthScore = 100;

    // Check for outdated dependencies
    const outdatedDeps = this.findOutdatedDependencies();
    if (outdatedDeps.length > 0) {
      issues.push(
        `${outdatedDeps.length} components have outdated dependencies`
      );
      recommendations.push(
        "Update component dependencies to latest compatible versions"
      );
      healthScore -= 10;
    }

    // Check for unused dependencies
    const unusedDeps = this.findUnusedDependencies();
    if (unusedDeps.length > 0) {
      issues.push(`${unusedDeps.length} dependencies appear to be unused`);
      recommendations.push("Remove unused dependencies to reduce bundle size");
      healthScore -= 5;
    }

    // Check for dependency cycles
    const cycles = this.findDependencyCycles();
    if (cycles.length > 0) {
      issues.push(`${cycles.length} circular dependencies detected`);
      recommendations.push("Refactor to eliminate circular dependencies");
      healthScore -= 20;
    }

    // Check version consistency
    const inconsistencies = this.checkVersionConsistency();
    if (inconsistencies.length > 0) {
      issues.push(`${inconsistencies.length} version inconsistencies found`);
      recommendations.push("Standardize dependency versions across components");
      healthScore -= 15;
    }

    return {
      healthScore: Math.max(0, healthScore),
      issues,
      recommendations,
    };
  }

  /**
   * Private helper methods
   */

  private recordVersion(component: IngestedComponent): void {
    const version: ComponentVersion = {
      componentId: component.id,
      version: component.version || "1.0.0",
      releaseDate: Date.now(),
      breaking: this.isBreakingVersion(component.version),
      changes: [], // Would be populated from changelog/release notes
      compatibleVersions: this.getCompatibleVersions(
        component.id,
        component.version || "1.0.0"
      ),
    };

    if (!this.versionHistory.has(component.id)) {
      this.versionHistory.set(component.id, []);
    }

    this.versionHistory.get(component.id)!.push(version);
  }

  private isBreakingVersion(version?: string): boolean {
    if (!version) return false;
    const parsed = semver.parse(version);
    return parsed ? parsed.major > 0 || parsed.minor > 0 : false;
  }

  private getCompatibleVersions(
    componentId: string,
    version: string
  ): string[] {
    // Simple implementation - would need more sophisticated compatibility checking
    const history = this.versionHistory.get(componentId) || [];
    return history
      .filter((v) => semver.satisfies(v.version, `^${version}`))
      .map((v) => v.version);
  }

  private checkVersionCompatibility(
    componentA: string,
    versionA: string,
    componentB: string,
    versionB: string
  ): { compatible: boolean; issues: CompatibilityIssue[] } {
    // Simplified compatibility check
    // In a real implementation, this would check semver ranges
    const compatible =
      semver.satisfies(versionA, `^${versionB}`) ||
      semver.satisfies(versionB, `^${versionA}`);

    const issues: CompatibilityIssue[] = [];

    if (!compatible) {
      issues.push({
        type: "version_conflict",
        severity: "warning",
        message: `Versions ${versionA} and ${versionB} may not be compatible`,
        affectedComponents: [componentA, componentB],
        suggestion: "Review version compatibility requirements",
      });
    }

    return { compatible, issues };
  }

  private checkVersionConstraint(
    version: string,
    constraint: string
  ): {
    satisfies: boolean;
    suggestion?: string;
  } {
    try {
      const satisfies = semver.satisfies(version, constraint);
      let suggestion: string | undefined;

      if (!satisfies) {
        // Suggest a version that would satisfy the constraint
        const parsed = semver.parse(version);
        if (parsed) {
          suggestion =
            semver.maxSatisfying([version], constraint) || constraint;
        }
      }

      return { satisfies, suggestion };
    } catch {
      return { satisfies: false };
    }
  }

  private detectCircularDependencies(startId: string): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycle: string[] = [];

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = this.dependencyGraph.get(nodeId);
      if (node) {
        for (const depId of node.dependencies.keys()) {
          if (!visited.has(depId)) {
            if (dfs(depId)) {
              cycle.push(nodeId);
              return true;
            }
          } else if (recursionStack.has(depId)) {
            cycle.push(nodeId, depId);
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    if (dfs(startId) && cycle.length > 0) {
      return cycle.reverse();
    }

    return [];
  }

  private detectBreakingChanges(
    componentId: string,
    targetVersion: string
  ): string[] {
    const history = this.versionHistory.get(componentId) || [];
    const changes: string[] = [];

    for (const version of history) {
      if (semver.gt(version.version, targetVersion) && version.breaking) {
        changes.push(...version.changes);
      }
    }

    return changes;
  }

  private resolveVersionConstraints(
    componentId: string,
    constraints: string[]
  ): {
    version?: string;
    conflicts: string[];
    alternatives: string[];
  } {
    // Simplified version resolution
    // In a real implementation, this would use a proper dependency resolver
    const conflicts: string[] = [];
    const alternatives: string[] = [];

    if (constraints.length === 0) {
      return { conflicts, alternatives };
    }

    // Try to find a version that satisfies all constraints
    const history = this.versionHistory.get(componentId) || [];
    const versions = history.map((v) => v.version).sort(semver.rcompare);

    for (const version of versions) {
      const satisfied = constraints.every((constraint) => {
        try {
          return semver.satisfies(version, constraint);
        } catch {
          return false;
        }
      });

      if (satisfied) {
        return { version, conflicts, alternatives };
      }
    }

    // No version satisfies all constraints
    conflicts.push(...constraints);
    alternatives.push(...versions.slice(0, 3)); // Suggest latest 3 versions

    return { conflicts, alternatives };
  }

  private findOutdatedDependencies(): string[] {
    const outdated: string[] = [];

    for (const node of this.dependencyGraph.values()) {
      for (const [depId, dep] of node.dependencies) {
        const depNode = this.dependencyGraph.get(depId);
        if (depNode) {
          // Check if current version satisfies the constraint
          const check = this.checkVersionConstraint(
            depNode.version,
            dep.versionConstraint
          );
          if (!check.satisfies) {
            outdated.push(`${node.id} -> ${depId}`);
          }
        }
      }
    }

    return [...new Set(outdated)]; // Remove duplicates
  }

  private findUnusedDependencies(): string[] {
    const unused: string[] = [];

    for (const [componentId, node] of this.dependencyGraph) {
      for (const depId of node.dependencies.keys()) {
        const depNode = this.dependencyGraph.get(depId);
        if (depNode && depNode.dependents.size === 0) {
          unused.push(`${componentId} -> ${depId}`);
        }
      }
    }

    return unused;
  }

  private findDependencyCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();

    for (const nodeId of this.dependencyGraph.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = this.detectCircularDependencies(nodeId);
        if (cycle.length > 0) {
          cycles.push(cycle);
        }
        // Mark all nodes in this component as visited
        visited.add(nodeId);
      }
    }

    return cycles;
  }

  private checkVersionConsistency(): string[] {
    const inconsistencies: string[] = [];

    // Check if same dependency is used with different version constraints
    const dependencyConstraints = new Map<string, Set<string>>();

    for (const node of this.dependencyGraph.values()) {
      for (const [depId, dep] of node.dependencies) {
        if (!dependencyConstraints.has(depId)) {
          dependencyConstraints.set(depId, new Set());
        }
        dependencyConstraints.get(depId)!.add(dep.versionConstraint);
      }
    }

    for (const [depId, constraints] of dependencyConstraints) {
      if (constraints.size > 1) {
        inconsistencies.push(`${depId}: ${Array.from(constraints).join(", ")}`);
      }
    }

    return inconsistencies;
  }
}

/**
 * Global dependency manager instance
 */
let globalDependencyManager: DependencyManager | null = null;

/**
 * Get global dependency manager
 */
export function getDependencyManager(): DependencyManager {
  if (!globalDependencyManager) {
    globalDependencyManager = new DependencyManager();
  }
  return globalDependencyManager;
}

/**
 * Reset global dependency manager (for testing)
 */
export function resetDependencyManager(): void {
  if (globalDependencyManager) {
    globalDependencyManager = null;
  }
}
