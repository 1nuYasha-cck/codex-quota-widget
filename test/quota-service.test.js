const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeSnapshot } = require("../src/main/quota-service");

test("uses the seven-day window as the only displayed quota", () => {
  const result = normalizeSnapshot({
    primary: { usedPercent: 80, windowDurationMins: 300, resetsAt: 1_800_000_000 },
    secondary: { usedPercent: 25.4, windowDurationMins: 10_080, resetsAt: 1_900_000_000 }
  });

  assert.equal(result.weekly.remainingPercent, 75);
  assert.equal(result.remainingPercent, 75);
  assert.equal(result.weekly.windowDurationMins, 10_080);
  assert.equal("primary" in result, false);
  assert.equal("secondary" in result, false);
});

test("accepts a seven-day window returned as primary by newer Codex versions", () => {
  const result = normalizeSnapshot({
    primary: { usedPercent: 10, windowDurationMins: 10_080 }
  });

  assert.equal(result.weekly.remainingPercent, 90);
  assert.equal(result.remainingPercent, 90);
});
