const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const packageJson = require("../package.json");

test("macOS build embeds the app icon and applies a valid ad-hoc signature", () => {
  const buildScript = packageJson.scripts["build:mac"];

  assert.match(buildScript, /electron-builder --mac dir --arm64/);
  assert.match(buildScript, /codesign --force --deep --sign -/);
  assert.match(buildScript, /--identifier cn\.chatgpt\.quota\.desktop/);
  assert.equal(packageJson.build.appId, "cn.chatgpt.quota.desktop");
  assert.equal(packageJson.build.mac.icon, "assets/icon.icns");
});

test("macOS Dock icon is not overridden at runtime", () => {
  const mainSource = fs.readFileSync(path.join(__dirname, "../src/main/main.js"), "utf8");
  const dockSource = fs.readFileSync(path.join(__dirname, "../src/main/dock-visibility.js"), "utf8");

  assert.doesNotMatch(mainSource, /dock\.setIcon|setDockIcon|getDockIcon/);
  assert.doesNotMatch(dockSource, /dock\.setIcon|setDockIcon|getDockIcon/);
});
