/**
 * Access control and rate limiting system for design system operations
 * @author @darianrosebrook
 *
 * Provides fine-grained access control and rate limiting for:
 * - Component ingestion permissions
 * - Operation frequency limits
 * - User/role-based access control
 * - Audit logging for security events
 */

import type { IngestedComponent } from "./dynamic-component-registry";
import { getDesignSystemMonitor } from "./monitoring";

/**
 * User roles with different permission levels
 */
export enum UserRole {
  ADMIN = "admin",
  DEVELOPER = "developer",
  DESIGNER = "designer",
  VIEWER = "viewer",
}

/**
 * Operation types that can be controlled
 */
export enum OperationType {
  INGEST_COMPONENT = "ingest_component",
  DELETE_COMPONENT = "delete_component",
  UPDATE_COMPONENT = "update_component",
  VIEW_COMPONENT = "view_component",
  EXPORT_COMPONENTS = "export_components",
  IMPORT_COMPONENTS = "import_components",
  MODIFY_SETTINGS = "modify_settings",
}

/**
 * Permission result
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Access control rule
 */
export interface AccessRule {
  operation: OperationType;
  minRole: UserRole;
  conditions?: {
    sourcePattern?: RegExp;
    componentPattern?: RegExp;
    timeWindow?: { start: number; end: number };
  };
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  burstLimit?: number;
}

/**
 * User context for access control
 */
export interface UserContext {
  id: string;
  role: UserRole;
  groups?: string[];
  metadata?: Record<string, any>;
}

/**
 * Access control manager
 */
export class AccessControlManager {
  private rules: AccessRule[] = [];
  private rateLimits: Map<string, Map<OperationType, RateLimitState>> =
    new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default access control rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      // Admin-only operations
      {
        operation: OperationType.MODIFY_SETTINGS,
        minRole: UserRole.ADMIN,
      },
      {
        operation: OperationType.IMPORT_COMPONENTS,
        minRole: UserRole.ADMIN,
      },

      // Developer operations
      {
        operation: OperationType.INGEST_COMPONENT,
        minRole: UserRole.DEVELOPER,
      },
      {
        operation: OperationType.UPDATE_COMPONENT,
        minRole: UserRole.DEVELOPER,
      },
      {
        operation: OperationType.DELETE_COMPONENT,
        minRole: UserRole.DEVELOPER,
      },
      {
        operation: OperationType.EXPORT_COMPONENTS,
        minRole: UserRole.DEVELOPER,
      },

      // Designer operations (limited)
      {
        operation: OperationType.INGEST_COMPONENT,
        minRole: UserRole.DESIGNER,
        conditions: {
          sourcePattern: /^design-system$/, // Only design system components
        },
      },
      {
        operation: OperationType.VIEW_COMPONENT,
        minRole: UserRole.DESIGNER,
      },

      // Viewer operations (read-only)
      {
        operation: OperationType.VIEW_COMPONENT,
        minRole: UserRole.VIEWER,
      },
    ];
  }

  /**
   * Check if user has permission for operation
   */
  checkPermission(
    user: UserContext,
    operation: OperationType,
    context?: {
      component?: Partial<IngestedComponent>;
      source?: string;
    }
  ): PermissionResult {
    // Find applicable rules for this operation
    const applicableRules = this.rules.filter(
      (rule) => rule.operation === operation
    );

    if (applicableRules.length === 0) {
      return {
        allowed: false,
        reason: `No rules defined for operation: ${operation}`,
      };
    }

    // Check each rule
    for (const rule of applicableRules) {
      if (this.userMeetsRoleRequirement(user, rule.minRole)) {
        // Check additional conditions
        if (
          rule.conditions &&
          !this.checkConditions(rule.conditions, context)
        ) {
          continue; // Rule doesn't apply due to conditions
        }

        return { allowed: true };
      }
    }

    // No rule allowed this operation
    const highestAllowedRole = Math.max(
      ...applicableRules.map((rule) => this.roleToNumber(rule.minRole))
    );

    return {
      allowed: false,
      reason: `Insufficient permissions for operation: ${operation}`,
      requiredRole: this.numberToRole(highestAllowedRole),
    };
  }

  /**
   * Check rate limit for user operation
   */
  checkRateLimit(user: UserContext, operation: OperationType): RateLimitResult {
    const userKey = user.id;
    const now = Date.now();

    // Get or create user's rate limit state
    if (!this.rateLimits.has(userKey)) {
      this.rateLimits.set(userKey, new Map());
    }

    const userLimits = this.rateLimits.get(userKey)!;

    // Get or create operation-specific rate limit state
    if (!userLimits.has(operation)) {
      userLimits.set(operation, {
        requests: [],
        config: this.getRateLimitConfig(operation),
      });
    }

    const limitState = userLimits.get(operation)!;

    // Clean old requests outside the window
    const windowStart = now - limitState.config.windowMs;
    limitState.requests = limitState.requests.filter(
      (req) => req > windowStart
    );

    // Check if under limit
    const isUnderLimit =
      limitState.requests.length < limitState.config.requests;

    if (isUnderLimit) {
      limitState.requests.push(now);
    }

    const remainingRequests = Math.max(
      0,
      limitState.config.requests - limitState.requests.length
    );
    const resetTime = windowStart + limitState.config.windowMs;

    return {
      allowed: isUnderLimit,
      remainingRequests,
      resetTime,
      retryAfter: isUnderLimit
        ? undefined
        : Math.ceil((resetTime - now) / 1000),
    };
  }

  /**
   * Perform access-controlled operation
   */
  async performOperation<T>(
    user: UserContext,
    operation: OperationType,
    operationFn: () => Promise<T>,
    context?: {
      component?: Partial<IngestedComponent>;
      source?: string;
    }
  ): Promise<{ success: boolean; result?: T; error?: string }> {
    const monitor = getDesignSystemMonitor();

    // Check permissions
    const permission = this.checkPermission(user, operation, context);
    if (!permission.allowed) {
      monitor.recordMetric("access_denied", "counter", 1, {
        userId: user.id,
        operation,
        reason: permission.reason || "unknown",
      });

      return {
        success: false,
        error: permission.reason || "Access denied",
      };
    }

    // Check rate limits
    const rateLimit = this.checkRateLimit(user, operation);
    if (!rateLimit.allowed) {
      monitor.recordMetric("rate_limited", "counter", 1, {
        userId: user.id,
        operation,
      });

      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
      };
    }

    try {
      // Execute operation
      const result = await operationFn();

      // Record successful operation
      monitor.recordMetric("operation_success", "counter", 1, {
        userId: user.id,
        operation,
        userRole: user.role,
      });

      return { success: true, result };
    } catch (error) {
      // Record failed operation
      monitor.recordMetric("operation_failure", "counter", 1, {
        userId: user.id,
        operation,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Operation failed",
      };
    }
  }

  /**
   * Add custom access rule
   */
  addRule(rule: AccessRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove access rule
   */
  removeRule(operation: OperationType, minRole: UserRole): boolean {
    const index = this.rules.findIndex(
      (rule) => rule.operation === operation && rule.minRole === minRole
    );

    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get rate limit configuration for operation
   */
  private getRateLimitConfig(operation: OperationType): RateLimitConfig {
    // Different limits for different operations
    switch (operation) {
      case OperationType.INGEST_COMPONENT:
        return { requests: 10, windowMs: 60 * 1000 }; // 10 per minute
      case OperationType.DELETE_COMPONENT:
        return { requests: 5, windowMs: 60 * 1000 }; // 5 per minute
      case OperationType.UPDATE_COMPONENT:
        return { requests: 20, windowMs: 60 * 1000 }; // 20 per minute
      case OperationType.VIEW_COMPONENT:
        return { requests: 100, windowMs: 60 * 1000 }; // 100 per minute
      case OperationType.EXPORT_COMPONENTS:
        return { requests: 3, windowMs: 5 * 60 * 1000 }; // 3 per 5 minutes
      default:
        return { requests: 50, windowMs: 60 * 1000 }; // 50 per minute default
    }
  }

  /**
   * Check if user meets role requirement
   */
  private userMeetsRoleRequirement(
    user: UserContext,
    requiredRole: UserRole
  ): boolean {
    const userLevel = this.roleToNumber(user.role);
    const requiredLevel = this.roleToNumber(requiredRole);
    return userLevel >= requiredLevel;
  }

  /**
   * Convert role to numeric level for comparison
   */
  private roleToNumber(role: UserRole): number {
    switch (role) {
      case UserRole.ADMIN:
        return 4;
      case UserRole.DEVELOPER:
        return 3;
      case UserRole.DESIGNER:
        return 2;
      case UserRole.VIEWER:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Convert numeric level back to role
   */
  private numberToRole(level: number): UserRole {
    switch (level) {
      case 4:
        return UserRole.ADMIN;
      case 3:
        return UserRole.DEVELOPER;
      case 2:
        return UserRole.DESIGNER;
      case 1:
        return UserRole.VIEWER;
      default:
        return UserRole.VIEWER;
    }
  }

  /**
   * Check rule conditions
   */
  private checkConditions(
    conditions: NonNullable<AccessRule["conditions"]>,
    context?: { component?: Partial<IngestedComponent>; source?: string }
  ): boolean {
    // Check source pattern
    if (conditions.sourcePattern) {
      const source = context?.source || context?.component?.source;
      if (!source || !conditions.sourcePattern.test(source)) {
        return false;
      }
    }

    // Check component pattern
    if (conditions.componentPattern && context?.component?.name) {
      if (!conditions.componentPattern.test(context.component.name)) {
        return false;
      }
    }

    // Check time window
    if (conditions.timeWindow) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (
        currentMinutes < conditions.timeWindow.start ||
        currentMinutes > conditions.timeWindow.end
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get access control statistics
   */
  getAccessStats(): {
    totalRules: number;
    activeRateLimits: number;
    recentDenials: number;
  } {
    const recentDenials = Array.from(this.rateLimits.values())
      .flatMap((userLimits) => Array.from(userLimits.values()))
      .reduce(
        (sum, limit) =>
          sum + (limit.requests.length >= limit.config.requests ? 1 : 0),
        0
      );

    return {
      totalRules: this.rules.length,
      activeRateLimits: this.rateLimits.size,
      recentDenials,
    };
  }

  /**
   * Reset rate limits for user
   */
  resetRateLimits(userId: string): void {
    this.rateLimits.delete(userId);
  }

  /**
   * Clean up old rate limit data
   */
  cleanup(maxAgeMs = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;

    for (const [userId, userLimits] of this.rateLimits) {
      for (const [operation, limitState] of userLimits) {
        limitState.requests = limitState.requests.filter((req) => req > cutoff);

        if (limitState.requests.length === 0) {
          userLimits.delete(operation);
        }
      }

      if (userLimits.size === 0) {
        this.rateLimits.delete(userId);
      }
    }
  }
}

/**
 * Rate limit state
 */
interface RateLimitState {
  requests: number[];
  config: RateLimitConfig;
}

/**
 * Global access control manager instance
 */
let globalAccessControlManager: AccessControlManager | null = null;

/**
 * Get global access control manager
 */
export function getAccessControlManager(): AccessControlManager {
  if (!globalAccessControlManager) {
    globalAccessControlManager = new AccessControlManager();
  }
  return globalAccessControlManager;
}

/**
 * Reset global access control manager (for testing)
 */
export function resetAccessControlManager(): void {
  if (globalAccessControlManager) {
    globalAccessControlManager = null;
  }
}

/**
 * Create anonymous user context for basic operations
 */
export function createAnonymousUser(): UserContext {
  return {
    id: "anonymous",
    role: UserRole.VIEWER,
  };
}

/**
 * Create system user context for internal operations
 */
export function createSystemUser(): UserContext {
  return {
    id: "system",
    role: UserRole.ADMIN,
    metadata: { system: true },
  };
}
