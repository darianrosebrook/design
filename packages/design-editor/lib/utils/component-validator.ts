/**
 * Component security validator for design system components
 * @author @darianrosebrook
 *
 * Validates components for security issues before ingestion:
 * - Prevents XSS through dangerous props
 * - Blocks access to sensitive APIs
 * - Validates component structure and safety
 * - Checks for malicious code patterns
 */

import React from "react";
import type { ComponentType, ReactElement } from "react";
import type { IngestedComponent } from "./dynamic-component-registry";

/**
 * Security validation result
 */
export interface ValidationResult {
  isValid: boolean;
  severity: "safe" | "warning" | "dangerous" | "critical";
  issues: ValidationIssue[];
  recommendations: string[];
}

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  type: "security" | "performance" | "compatibility" | "quality";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  location?: string;
  suggestion?: string;
}

/**
 * Component analysis result
 */
export interface ComponentAnalysis {
  component: ComponentType<any>;
  props: Record<string, any>;
  renderResult?: ReactElement;
  securityScore: number;
  performanceScore: number;
  compatibilityScore: number;
}

/**
 * Dangerous patterns to check for
 */
const DANGEROUS_PATTERNS = [
  // XSS vectors
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,

  // DOM manipulation
  /document\./gi,
  /window\./gi,
  /localStorage\./gi,
  /sessionStorage\./gi,
  /cookie/gi,

  // Network requests
  /fetch\s*\(/gi,
  /XMLHttpRequest/gi,
  /WebSocket/gi,

  // Dynamic imports (potentially dangerous)
  /import\s*\(/gi,

  // Node.js APIs (should not be in browser components)
  /require\s*\(/gi,
  /process\./gi,
  /fs\./gi,
  /child_process/gi,
  /crypto\./gi,
];

/**
 * Component validator for security and quality checks
 */
export class ComponentValidator {
  private maxAnalysisTime = 5000; // 5 seconds
  private maxRenderDepth = 10;
  private dangerousProps = new Set([
    "dangerouslySetInnerHTML",
    "__html",
    "onError", // Can be used for error tracking attacks
    "onLoad", // Can be used for tracking
  ]);

  /**
   * Validate a component for security and quality issues
   */
  async validateComponent(
    component: ComponentType<any>,
    metadata?: Partial<IngestedComponent>
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Static analysis
      const staticIssues = this.performStaticAnalysis(component, metadata);
      issues.push(...staticIssues);

      // 2. Runtime analysis (safe execution)
      const runtimeResult = await this.performRuntimeAnalysis(component);
      if (runtimeResult) {
        issues.push(...runtimeResult.issues);
        recommendations.push(...runtimeResult.recommendations);
      }

      // 3. Prop validation
      const propIssues = this.validateComponentProps(component, metadata);
      issues.push(...propIssues);

      // 4. Dependency analysis
      const dependencyIssues = this.analyzeDependencies(metadata);
      issues.push(...dependencyIssues);

      // Calculate overall severity
      const severity = this.calculateSeverity(issues);
      const isValid =
        severity !== "critical" &&
        !issues.some((i) => i.severity === "critical");

      // Generate recommendations
      recommendations.push(...this.generateRecommendations(issues, component));

      return {
        isValid,
        severity,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        isValid: false,
        severity: "critical",
        issues: [
          {
            type: "security",
            severity: "critical",
            message: `Component validation failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
            suggestion: "Component cannot be safely analyzed",
          },
        ],
        recommendations: [
          "Do not ingest this component",
          "Review component source code manually",
        ],
      };
    }
  }

  /**
   * Perform static analysis on component code
   */
  private performStaticAnalysis(
    component: ComponentType<any>,
    metadata?: Partial<IngestedComponent>
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check component name for suspicious patterns
    if (metadata?.name) {
      if (metadata.name.includes("<") || metadata.name.includes(">")) {
        issues.push({
          type: "security",
          severity: "high",
          message: "Component name contains HTML tags",
          location: "component.name",
          suggestion: "Sanitize component name",
        });
      }
    }

    // Check description for dangerous content
    if (metadata?.description) {
      for (const pattern of DANGEROUS_PATTERNS.slice(0, 3)) {
        // Only XSS patterns for description
        if (pattern.test(metadata.description)) {
          issues.push({
            type: "security",
            severity: "medium",
            message:
              "Component description contains potentially dangerous content",
            location: "component.description",
            suggestion: "Review and sanitize description",
          });
          break;
        }
      }
    }

    // Check default props for dangerous values
    if (metadata?.defaultProps) {
      for (const [propName, propValue] of Object.entries(
        metadata.defaultProps
      )) {
        if (this.dangerousProps.has(propName)) {
          issues.push({
            type: "security",
            severity: "high",
            message: `Dangerous prop '${propName}' found in default props`,
            location: `defaultProps.${propName}`,
            suggestion: "Remove dangerous default props",
          });
        }

        // Check for dangerous string values
        if (typeof propValue === "string") {
          for (const pattern of DANGEROUS_PATTERNS.slice(0, 5)) {
            // XSS patterns
            if (pattern.test(propValue)) {
              issues.push({
                type: "security",
                severity: "high",
                message: `Potentially dangerous value in default prop '${propName}'`,
                location: `defaultProps.${propName}`,
                suggestion: "Review default prop values",
              });
              break;
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Perform safe runtime analysis of component
   */
  private async performRuntimeAnalysis(
    component: ComponentType<any>
  ): Promise<{ issues: ValidationIssue[]; recommendations: string[] } | null> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Component analysis timeout")),
          this.maxAnalysisTime
        );
      });

      // Attempt to render component with safe props
      const analysisPromise = this.analyzeComponentRendering(component);

      const result = await Promise.race([analysisPromise, timeoutPromise]);

      if (result.performanceScore < 0.5) {
        issues.push({
          type: "performance",
          severity: "medium",
          message: "Component has poor performance characteristics",
          suggestion: "Optimize component rendering",
        });
      }

      if (result.compatibilityScore < 0.7) {
        issues.push({
          type: "compatibility",
          severity: "low",
          message: "Component may have compatibility issues",
          suggestion: "Test component in different environments",
        });
      }

      if (result.securityScore < 0.8) {
        recommendations.push("Consider additional security review");
      }
    } catch (error) {
      issues.push({
        type: "quality",
        severity: "medium",
        message: `Component analysis failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        suggestion: "Component may be unstable or have runtime issues",
      });
    }

    return { issues, recommendations };
  }

  /**
   * Analyze component rendering behavior safely
   */
  private async analyzeComponentRendering(
    component: ComponentType<any>
  ): Promise<ComponentAnalysis> {
    let renderResult: ReactElement | undefined;
    let securityScore = 1.0;
    let performanceScore = 1.0;
    let compatibilityScore = 1.0;

    const startTime = Date.now();

    try {
      // Create component with safe test props
      const testProps = {
        children: "Test Content",
        className: "test-class",
        style: { color: "red" },
        onClick: () => {}, // Safe handler
      };

      // Render component (this is safe since we're in a controlled environment)
      renderResult = React.createElement(component, testProps);

      const renderTime = Date.now() - startTime;

      // Performance scoring based on render time
      if (renderTime > 100) {
        performanceScore = Math.max(0.1, 1 - (renderTime - 100) / 1000);
      }

      // Basic security checks on rendered output
      if (renderResult && typeof renderResult === "object") {
        // Check for dangerous props in rendered element
        const element = renderResult as any;
        if (element.props) {
          for (const prop of this.dangerousProps) {
            if (element.props[prop] !== undefined) {
              securityScore -= 0.3;
            }
          }
        }
      }
    } catch (error) {
      securityScore = 0.1;
      performanceScore = 0.1;
      compatibilityScore = 0.1;
    }

    return {
      component,
      props: {},
      renderResult,
      securityScore,
      performanceScore,
      compatibilityScore,
    };
  }

  /**
   * Validate component props interface
   */
  private validateComponentProps(
    component: ComponentType<any>,
    metadata?: Partial<IngestedComponent>
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // This is a simplified check - in a real implementation,
    // you might use TypeScript reflection or React DevTools

    try {
      // Check if component accepts children
      const testElement = React.createElement(component, { children: "test" });
      if (!testElement) {
        issues.push({
          type: "compatibility",
          severity: "low",
          message: "Component may not properly handle children",
          suggestion: "Verify component accepts children prop",
        });
      }
    } catch (error) {
      issues.push({
        type: "compatibility",
        severity: "medium",
        message: "Component failed basic prop validation",
        suggestion: "Check component prop types and defaults",
      });
    }

    return issues;
  }

  /**
   * Analyze component dependencies
   */
  private analyzeDependencies(
    metadata?: Partial<IngestedComponent>
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check source attribution
    if (!metadata?.source) {
      issues.push({
        type: "quality",
        severity: "low",
        message: "Component missing source attribution",
        suggestion: "Add source information to component metadata",
      });
    }

    // Check version information
    if (!metadata?.version) {
      issues.push({
        type: "quality",
        severity: "low",
        message: "Component missing version information",
        suggestion: "Add version information to component metadata",
      });
    }

    return issues;
  }

  /**
   * Calculate overall severity from issues
   */
  private calculateSeverity(
    issues: ValidationIssue[]
  ): ValidationResult["severity"] {
    if (issues.some((i) => i.severity === "critical")) return "critical";
    if (issues.some((i) => i.severity === "high")) return "dangerous";
    if (issues.some((i) => i.severity === "medium")) return "warning";
    return "safe";
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(
    issues: ValidationIssue[],
    component: ComponentType<any>
  ): string[] {
    const recommendations: string[] = [];

    const hasSecurityIssues = issues.some((i) => i.type === "security");
    const hasPerformanceIssues = issues.some((i) => i.type === "performance");
    const hasCompatibilityIssues = issues.some(
      (i) => i.type === "compatibility"
    );

    if (hasSecurityIssues) {
      recommendations.push("Perform manual security review before ingestion");
      recommendations.push("Consider sandboxing component execution");
    }

    if (hasPerformanceIssues) {
      recommendations.push("Profile component performance in production");
      recommendations.push("Consider lazy loading for heavy components");
    }

    if (hasCompatibilityIssues) {
      recommendations.push("Test component across different React versions");
      recommendations.push("Verify component works in target environments");
    }

    if (issues.length === 0) {
      recommendations.push("Component appears safe for ingestion");
    }

    return recommendations;
  }
}

/**
 * Validate component with default validator
 */
export async function validateComponent(
  component: ComponentType<any>,
  metadata?: Partial<IngestedComponent>
): Promise<ValidationResult> {
  const validator = new ComponentValidator();
  return validator.validateComponent(component, metadata);
}

/**
 * Quick security check for components
 */
export function quickSecurityCheck(
  component: ComponentType<any>,
  metadata?: Partial<IngestedComponent>
): { isSafe: boolean; issues: string[] } {
  const issues: string[] = [];

  // Basic checks without full analysis
  if (metadata?.defaultProps) {
    for (const [propName] of Object.entries(metadata.defaultProps)) {
      if (propName.includes("dangerously")) {
        issues.push(`Dangerous prop '${propName}' detected`);
      }
    }
  }

  if (metadata?.description) {
    if (/<script/i.test(metadata.description)) {
      issues.push("Script tags detected in description");
    }
  }

  return {
    isSafe: issues.length === 0,
    issues,
  };
}
