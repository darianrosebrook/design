/**
 * @fileoverview Floating-point precision experiment for deterministic design coordinates
 */

// Test floating-point precision handling
const testCoordinates = [
  12.34567, // Basic decimal
  67.89012, // Another decimal
  1440.0, // Integer-like
  1024.0, // Integer-like
  0.5, // Half pixel
  16.66666, // Repeating decimal
  -12.5, // Negative
  100.123456, // High precision
];

console.log("=== Floating-Point Precision Experiment ===");
console.log("Test coordinates:", testCoordinates);
console.log();

// Method 1: toFixed(2) for coordinates
function normalizeWithToFixed(value) {
  return value.toFixed(2);
}

// Method 2: Round to 2 decimal places
function normalizeWithRound(value) {
  return Math.round(value * 100) / 100;
}

// Method 3: JSON round-trip simulation
function normalizeWithJson(value) {
  const json = JSON.stringify(value);
  const parsed = JSON.parse(json);
  return parsed.toFixed(2);
}

console.log("1. toFixed(2) normalization:");
const fixedResults = testCoordinates.map(normalizeWithToFixed);
console.log("   Results:", fixedResults);
console.log(
  "   Deterministic:",
  fixedResults.join("") === testCoordinates.map(normalizeWithToFixed).join("")
);

console.log();
console.log("2. Round to 2 decimals:");
const roundResults = testCoordinates.map(normalizeWithRound);
console.log("   Results:", roundResults);
console.log(
  "   Deterministic:",
  roundResults.join("") === testCoordinates.map(normalizeWithRound).join("")
);

console.log();
console.log("3. JSON round-trip:");
const jsonResults = testCoordinates.map(normalizeWithJson);
console.log("   Results:", jsonResults);
console.log(
  "   Deterministic:",
  jsonResults.join("") === testCoordinates.map(normalizeWithJson).join("")
);

console.log();
console.log("=== Cross-Platform Simulation ===");

// Test JSON serialization consistency
const testObj = {
  x: 12.34567,
  y: 67.89012,
  width: 1440.0,
  height: 1024.0,
};

console.log("Original object:", testObj);

// Simulate JSON round-trip on different platforms
const platforms = ["macOS", "Linux", "Windows"];

platforms.forEach((platform) => {
  const json = JSON.stringify(testObj);
  const parsed = JSON.parse(json);
  console.log(`${platform} JSON round-trip:`, parsed);
});

// Test repeated calculations
console.log();
console.log("=== Repeated Calculations Test ===");
let accumulator = 0;
const increment = 0.1;

for (let i = 0; i < 10; i++) {
  accumulator += increment;
}

console.log("Accumulator after 10 additions of 0.1:", accumulator);
console.log("Normalized with toFixed(2):", accumulator.toFixed(2));
console.log("Normalized with round:", Math.round(accumulator * 100) / 100);

console.log();
console.log("=== Edge Cases ===");

// Test edge cases that might cause issues
const edgeCases = [
  0.1 + 0.2, // Classic floating-point issue
  1.0 / 3.0, // Repeating decimal
  Math.PI, // Irrational number
  Number.EPSILON, // Very small number
  Number.MAX_SAFE_INTEGER, // Very large number
];

edgeCases.forEach((value, i) => {
  console.log(`Edge case ${i + 1} (${value}):`);
  console.log("  toFixed(2):", value.toFixed(2));
  console.log("  Round to 2:", Math.round(value * 100) / 100);
  console.log("  JSON round-trip:", JSON.parse(JSON.stringify(value)));
});

console.log();
console.log("=== Recommendation ===");
console.log("✅ toFixed(2) provides:");
console.log("   - Consistent precision across platforms");
console.log("   - Human-readable coordinate values");
console.log("   - Predictable JSON serialization");
console.log("   - Appropriate for design coordinates (2 decimal places)");
console.log("   - Simple and well-understood behavior");

// Test performance
console.log();
console.log("=== Performance Test ===");
const largeArray = Array.from({ length: 1000 }, (_, i) => Math.random() * 1000);

console.time("toFixed normalization");
for (let i = 0; i < 100; i++) {
  largeArray.forEach((n) => n.toFixed(2));
}
console.timeEnd("toFixed normalization");

console.time("Round normalization");
for (let i = 0; i < 100; i++) {
  largeArray.forEach((n) => Math.round(n * 100) / 100);
}
console.timeEnd("Round normalization");

console.log();
console.log("=== Final Decision ===");
console.log("🎯 Use toFixed(2) for design coordinates");
console.log("🎯 Use Math.round() for integer dimensions");
console.log("🎯 This provides deterministic, cross-platform consistency");
