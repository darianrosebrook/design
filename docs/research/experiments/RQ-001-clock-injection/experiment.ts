/**
 * @fileoverview Clock injection experiment for deterministic code generation
 * @author @darianrosebrook
 */

import { ulid } from "ulidx";

/**
 * Clock interface for deterministic time operations
 */
export interface Clock {
  now(): number;
  uuid(): string;
  random?(): number;
}

/**
 * Default clock implementation using system time
 */
export const defaultClock: Clock = {
  now: () => Date.now(),
  uuid: () => ulid(),
  random: () => Math.random(),
};

/**
 * Fixed clock for testing (deterministic)
 */
export const fixedClock = (timestamp: number, uuid: string): Clock => ({
  now: () => timestamp,
  uuid: () => uuid,
  random: () => 0.5,
});

/**
 * Code generation options
 */
export interface CodeGenOptions {
  clock?: Clock;
  format?: "tsx" | "jsx";
  indent?: number;
}

/**
 * Simple test document for experimentation
 */
const testDocument = {
  schemaVersion: "0.1.0",
  id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
  name: "Test Document",
  artboards: [
    {
      id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
      name: "Artboard 1",
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

/**
 * Generate React component with injected clock
 */
export function generateReactComponent(
  document: any,
  options: CodeGenOptions = {}
): string {
  const clock = options.clock ?? defaultClock;
  const timestamp = clock.now();
  const componentId = clock.uuid();

  return `// Generated at ${timestamp}
// Component ID: ${componentId}
import React from 'react';

export default function GeneratedComponent() {
  return (
    <div>
      {/* Generated content */}
    </div>
  );
}`;
}

/**
 * Test determinism with fixed clock
 */
export function testDeterminism(): boolean {
  const fixedTimestamp = 1234567890000;
  const fixedUuid = "01JF2PZV9G2WR5C3W7P0YHNX9D";

  const clock = fixedClock(fixedTimestamp, fixedUuid);

  const output1 = generateReactComponent(testDocument, { clock });
  const output2 = generateReactComponent(testDocument, { clock });

  console.log("Output 1:", output1);
  console.log("Output 2:", output2);
  console.log("Are identical:", output1 === output2);

  return output1 === output2;
}

/**
 * Test cross-platform consistency
 */
export function testCrossPlatform(): boolean {
  // Simulate different platforms by using same fixed clock
  const clock1 = fixedClock(1234567890000, "01JF2PZV9G2WR5C3W7P0YHNX9D");
  const clock2 = fixedClock(1234567890000, "01JF2PZV9G2WR5C3W7P0YHNX9D");

  const output1 = generateReactComponent(testDocument, { clock: clock1 });
  const output2 = generateReactComponent(testDocument, { clock: clock2 });

  console.log("Cross-platform identical:", output1 === output2);
  return output1 === output2;
}

/**
 * Test with real system clock (should be different)
 */
export function testNonDeterminism(): boolean {
  const output1 = generateReactComponent(testDocument);
  const output2 = generateReactComponent(testDocument);

  console.log("Non-deterministic (should be different):", output1 !== output2);
  return output1 !== output2;
}

// Run experiments
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("=== Clock Injection Experiment ===");
  console.log("Determinism test:", testDeterminism());
  console.log("Cross-platform test:", testCrossPlatform());
  console.log("Non-determinism test:", testNonDeterminism());
}
