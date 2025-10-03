/**
 * @fileoverview String sorting experiment for deterministic output
 */

// Test different sorting approaches
const testKeys = [
  "z",
  "a",
  "m",
  "b", // Basic ASCII
  "item10",
  "item2",
  "item1", // Numeric
  "café",
  "cafe", // Unicode accents
  "ClassName",
  "className", // Case sensitivity
  "component-name",
  "component_name", // Special characters
];

console.log("=== String Sorting Experiment ===");
console.log("Test keys:", testKeys);
console.log();

// Method 1: Simple string comparison
function simpleSort(items) {
  return [...items].sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}

// Method 2: Intl.Collator
function collatorSort(items) {
  const collator = new Intl.Collator("en-US", {
    numeric: true,
    sensitivity: "base",
    ignorePunctuation: false,
  });
  return [...items].sort(collator.compare);
}

// Method 3: Locale-aware comparison
function localeSort(items) {
  return [...items].sort((a, b) =>
    a.localeCompare(b, "en-US", { numeric: true })
  );
}

console.log("1. Simple string comparison:");
const simple = simpleSort(testKeys);
console.log("   Result:", simple);
console.log(
  "   Deterministic:",
  simple.join("") === simpleSort(testKeys).join("")
);

console.log();
console.log("2. Intl.Collator:");
const collator = collatorSort(testKeys);
console.log("   Result:", collator);
console.log(
  "   Deterministic:",
  collator.join("") === collatorSort(testKeys).join("")
);

console.log();
console.log("3. Locale compare:");
const locale = localeSort(testKeys);
console.log("   Result:", locale);
console.log(
  "   Deterministic:",
  locale.join("") === localeSort(testKeys).join("")
);

console.log();
console.log("=== Cross-Platform Simulation ===");

// Simulate different platforms
const platforms = [
  { name: "macOS", locale: "en-US" },
  { name: "Linux", locale: "en-US" },
  { name: "Windows", locale: "en-US" },
];

platforms.forEach((platform) => {
  const collator = new Intl.Collator(platform.locale, {
    numeric: true,
    sensitivity: "base",
  });
  const result = testKeys.sort(collator.compare);
  console.log(`${platform.name}:`, result.join(", "));
});

// Test object key sorting
console.log();
console.log("=== Object Key Sorting ===");
const testObj = { z: 1, a: 2, m: 3, b: 4, item10: 5, item2: 6 };

function sortObjectKeys(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort((a, b) => {
    // Use Intl.Collator for consistent sorting
    return new Intl.Collator("en-US", { numeric: true }).compare(a, b);
  });

  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

const sortedObj = sortObjectKeys(testObj);
console.log("Original keys:", Object.keys(testObj));
console.log("Sorted keys:  ", Object.keys(sortedObj));
console.log(
  "Consistent:   ",
  Object.keys(sortedObj).join("") ===
    Object.keys(sortObjectKeys(testObj)).join("")
);

console.log();
console.log("=== Performance Test ===");
const largeArray = Array.from({ length: 1000 }, (_, i) => `item${i}`);

console.time("Intl.Collator sort");
for (let i = 0; i < 100; i++) {
  largeArray.sort((a, b) =>
    new Intl.Collator("en-US", { numeric: true }).compare(a, b)
  );
}
console.timeEnd("Intl.Collator sort");

console.time("Simple sort");
for (let i = 0; i < 100; i++) {
  largeArray.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}
console.timeEnd("Simple sort");

console.log();
console.log("=== Recommendation ===");
console.log("✅ Intl.Collator provides:");
console.log("   - Cross-platform consistency");
console.log("   - Proper Unicode handling");
console.log("   - Numeric sorting (item1, item2, item10)");
console.log("   - Standard JavaScript API");
console.log("   - Acceptable performance for our use case");
