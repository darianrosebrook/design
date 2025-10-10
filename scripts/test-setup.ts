/**
 * @fileoverview Global test setup for CAWS compliance
 * @author @darianrosebrook
 */

import { beforeAll, afterAll, beforeEach } from "vitest";

// Global test environment setup
beforeAll(async () => {
  // Initialize any global test state
  console.log("🧪 Setting up CAWS test environment");
});

afterAll(async () => {
  // Cleanup after all tests
  console.log("🧪 Cleaning up CAWS test environment");
});

beforeEach(() => {
  // Reset any global state before each test
});

// Mock console methods to reduce noise in tests unless explicitly testing them
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  // Uncomment to reduce test output noise
  // log: () => {},
  // info: () => {},
  // debug: () => {},
};

// Performance monitoring for tests
global.performanceMarks = new Map<string, number>();

// Helper function for performance measurement in tests
global.markPerformance = (name: string) => {
  global.performanceMarks.set(name, performance.now());
};

global.measurePerformance = (name: string, startMark?: string) => {
  const end = performance.now();
  const start = startMark ? global.performanceMarks.get(startMark) || 0 : 0;
  return end - start;
};

// CAWS test utilities
global.caws = {
  // Helper to validate CAWS compliance
  validateCoverage: (threshold: number = 80) => {
    // This will be implemented by the CAWS gate checker
    return true;
  },

  // Helper to check test quality metrics
  validateTestQuality: () => {
    // This will be implemented by the CAWS test quality analyzer
    return true;
  },

  // Helper to ensure spec-to-test traceability
  validateSpecCoverage: () => {
    // This will be implemented by the CAWS spec mapper
    return true;
  },
};
