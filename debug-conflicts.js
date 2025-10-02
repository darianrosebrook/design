const {
  detectConflicts,
} = require("./packages/canvas-engine/src/merge/conflict-detector.js");
const {
  MERGE_TEST_SCENARIOS,
} = require("./packages/canvas-engine/tests/merge/scenarios.js");

const scenario = MERGE_TEST_SCENARIOS.find(
  (s) => s.name === "single_property_change"
);
console.log("Scenario:", scenario.name);
console.log("Expected conflicts:", scenario.expectedConflicts.count);

const result = detectConflicts({
  base: scenario.base,
  local: scenario.local,
  remote: scenario.remote,
});

console.log("Actual conflicts:", result.conflicts.length);
console.log(
  "Conflicts:",
  result.conflicts.map((c) => c.code)
);
