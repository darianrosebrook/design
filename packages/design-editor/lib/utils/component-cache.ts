/**
 * Component caching system for performance optimization
 * @author @darianrosebrook
 *
 * Provides intelligent caching for:
 * - Component loading and rendering
 * - Metadata and validation results
 * - Dependency resolution
 * - Performance metrics
 */

import type { ComponentType } from "react";
import type { IngestedComponent } from "./dynamic-component-registry";

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Approximate memory size
}

/**
 * Cache statistics
 */
export interface CacheStats {
  entries: number;
  totalSize: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

/**
 * Component cache configuration
 */
export interface ComponentCacheConfig {
  maxSize: number; // Maximum cache size in bytes
  ttl: number; // Time to live in milliseconds
  maxEntries: number; // Maximum number of entries
  enableCompression?: boolean;
}

/**
 * Intelligent component cache with LRU eviction and TTL
 */
export class ComponentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: ComponentCacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(config: Partial<ComponentCacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      ttl: 30 * 60 * 1000, // 30 minutes default
      maxEntries: 1000,
      enableCompression: false,
      ...config,
    };
  }

  /**
   * Get cached item with automatic expiration and access tracking
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set cache entry with size calculation
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    const size = this.calculateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: customTtl
        ? Date.now() + customTtl
        : Date.now() + this.config.ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
    };

    // Check if we need to evict entries
    this.enforceSizeLimits();

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = this.cache.size;
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
    const hitRate =
      this.stats.hits / (this.stats.hits + this.stats.misses) || 0;

    return {
      entries,
      totalSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate,
    };
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return entry.expiresAt ? Date.now() > entry.expiresAt : false;
  }

  /**
   * Calculate approximate memory size of data
   */
  private calculateSize(data: any): number {
    try {
      // Rough estimation based on JSON stringification
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // UTF-16 characters
    } catch {
      // Fallback for non-serializable objects
      return 1024; // 1KB estimate
    }
  }

  /**
   * Enforce cache size limits using LRU eviction
   */
  private enforceSizeLimits(): void {
    // Check entry count limit
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    // Check size limit
    let totalSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
    while (totalSize > this.config.maxSize && this.cache.size > 0) {
      this.evictLRU();
      totalSize = Array.from(this.cache.values()).reduce(
        (sum, entry) => sum + entry.size,
        0
      );
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | undefined;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.evictions++;
      }
    }
  }

  /**
   * Get cache keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Component-specific cache with optimized storage
 */
export class ComponentCacheManager {
  private componentCache: ComponentCache;
  private metadataCache: ComponentCache;
  private validationCache: ComponentCache;
  private renderCache: ComponentCache;

  constructor(config?: Partial<ComponentCacheConfig>) {
    const cacheConfig = { maxSize: 25 * 1024 * 1024, ...config }; // 25MB per cache

    this.componentCache = new ComponentCache({
      ...cacheConfig,
      ttl: 60 * 60 * 1000,
    }); // 1 hour
    this.metadataCache = new ComponentCache({
      ...cacheConfig,
      ttl: 30 * 60 * 1000,
    }); // 30 minutes
    this.validationCache = new ComponentCache({
      ...cacheConfig,
      ttl: 24 * 60 * 60 * 1000,
    }); // 24 hours
    this.renderCache = new ComponentCache({
      ...cacheConfig,
      ttl: 10 * 60 * 1000,
    }); // 10 minutes
  }

  /**
   * Cache component definition
   */
  cacheComponent(id: string, component: ComponentType<any>): void {
    this.componentCache.set(`component:${id}`, component);
  }

  /**
   * Get cached component
   */
  getComponent(id: string): ComponentType<any> | undefined {
    return this.componentCache.get(`component:${id}`);
  }

  /**
   * Cache component metadata
   */
  cacheMetadata(id: string, metadata: Partial<IngestedComponent>): void {
    this.metadataCache.set(`metadata:${id}`, metadata);
  }

  /**
   * Get cached metadata
   */
  getMetadata(id: string): Partial<IngestedComponent> | undefined {
    return this.metadataCache.get(`metadata:${id}`);
  }

  /**
   * Cache validation results
   */
  cacheValidation(id: string, validationResult: any): void {
    this.validationCache.set(`validation:${id}`, validationResult);
  }

  /**
   * Get cached validation results
   */
  getValidation(id: string): any | undefined {
    return this.validationCache.get(`validation:${id}`);
  }

  /**
   * Cache render results for performance
   */
  cacheRenderResult(componentId: string, props: any, result: any): void {
    const key = `render:${componentId}:${JSON.stringify(props)}`;
    this.renderCache.set(key, result);
  }

  /**
   * Get cached render result
   */
  getRenderResult(componentId: string, props: any): any | undefined {
    const key = `render:${componentId}:${JSON.stringify(props)}`;
    return this.renderCache.get(key);
  }

  /**
   * Preload frequently used components
   */
  async preloadComponents(componentIds: string[]): Promise<void> {
    const preloadPromises = componentIds.map(async (id) => {
      // Pre-warm component cache
      if (!this.componentCache.has(`component:${id}`)) {
        // In a real implementation, this would load the component
        // For now, just mark as preloaded
        this.componentCache.set(`preload:${id}`, true, 5 * 60 * 1000); // 5 minutes
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): {
    components: CacheStats;
    metadata: CacheStats;
    validation: CacheStats;
    render: CacheStats;
  } {
    return {
      components: this.componentCache.getStats(),
      metadata: this.metadataCache.getStats(),
      validation: this.validationCache.getStats(),
      render: this.renderCache.getStats(),
    };
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.componentCache.clear();
    this.metadataCache.clear();
    this.validationCache.clear();
    this.renderCache.clear();
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    this.componentCache.cleanup();
    this.metadataCache.cleanup();
    this.validationCache.cleanup();
    this.renderCache.cleanup();
  }
}

// Global cache manager instance
let globalCacheManager: ComponentCacheManager | null = null;

/**
 * Get global component cache manager
 */
export function getComponentCache(): ComponentCacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new ComponentCacheManager();
  }
  return globalCacheManager;
}

/**
 * Reset global cache manager (for testing)
 */
export function resetComponentCache(): void {
  if (globalCacheManager) {
    globalCacheManager.clear();
    globalCacheManager = null;
  }
}
