const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { normalizeSnapshot, resolveCodexCandidates } = require("../src/main/quota-service");

test("normalizes both the five-hour and seven-day quota windows", () => {
  const result = normalizeSnapshot({
    primary: { usedPercent: 80, windowDurationMins: 300, resetsAt: 1_800_000_000 },
    secondary: { usedPercent: 25.4, windowDurationMins: 10_080, resetsAt: 1_900_000_000 }
  });

  assert.equal(result.fiveHour.remainingPercent, 20);
  assert.equal(result.fiveHour.windowDurationMins, 300);
  assert.equal(result.weekly.remainingPercent, 75);
  assert.equal(result.remainingPercent, 75);
  assert.equal(result.weekly.windowDurationMins, 10_080);
});

test("accepts a seven-day window returned as primary by newer Codex versions", () => {
  const result = normalizeSnapshot({
    primary: { usedPercent: 10, windowDurationMins: 10_080 }
  });

  assert.equal(result.weekly.remainingPercent, 90);
  assert.equal(result.fiveHour, null);
  assert.equal(result.remainingPercent, 90);
});

test("keeps a five-hour-only response usable", () => {
  const result = normalizeSnapshot({
    primary: { usedPercent: 62, windowDurationMins: 300 }
  });

  assert.equal(result.fiveHour.remainingPercent, 38);
  assert.equal(result.weekly, null);
  assert.equal(result.remainingPercent, 38);
});

test("supports older snapshots that omit window durations", () => {
  const result = normalizeSnapshot({
    primary: { usedPercent: 30 },
    secondary: { usedPercent: 45 }
  });

  assert.equal(result.fiveHour.remainingPercent, 70);
  assert.equal(result.weekly.remainingPercent, 55);
});

test("finds a global npm Codex command before the PATH fallback", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codex-widget-test-"));
  const appData = path.join(root, "Roaming");
  const command = path.join(appData, "npm", "codex.cmd");
  fs.mkdirSync(path.dirname(command), { recursive: true });
  fs.writeFileSync(command, "@echo off\r\n");

  try {
    const candidates = resolveCodexCandidates({
      APPDATA: appData,
      LOCALAPPDATA: path.join(root, "Local"),
      USERPROFILE: root,
      PATH: ""
    });
    assert.equal(candidates[0], command);
    assert.equal(candidates.at(-1), "codex");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("finds a macOS Codex CLI installed in the user's local bin", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codex-widget-test-"));
  const command = path.join(root, ".local", "bin", "codex");
  fs.mkdirSync(path.dirname(command), { recursive: true });
  fs.writeFileSync(command, "#!/bin/sh\n");

  try {
    const candidates = resolveCodexCandidates({ HOME: root, PATH: "" }, "darwin");
    assert.equal(candidates[0], command);
    assert.equal(candidates.at(-1), "codex");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
