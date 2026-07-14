const test = require("node:test");
const assert = require("node:assert/strict");
const { syncDockVisibility, setDockIcon } = require("../src/main/dock-visibility");

test("macOS shows the Dock icon while the widget is visible", () => {
  const calls = [];
  const dock = { show: () => calls.push("show"), hide: () => calls.push("hide") };

  assert.equal(syncDockVisibility({ platform: "darwin", dock, widgetVisible: true }), true);
  assert.deepEqual(calls, ["show"]);
});

test("macOS hides the Dock icon after the widget is hidden", () => {
  const calls = [];
  const dock = { show: () => calls.push("show"), hide: () => calls.push("hide") };

  assert.equal(syncDockVisibility({ platform: "darwin", dock, widgetVisible: false }), true);
  assert.deepEqual(calls, ["hide"]);
});

test("other platforms do not change Dock visibility", () => {
  const calls = [];
  const dock = { show: () => calls.push("show"), hide: () => calls.push("hide") };

  assert.equal(syncDockVisibility({ platform: "win32", dock, widgetVisible: false }), false);
  assert.deepEqual(calls, []);
});

test("macOS refreshes the Dock icon at launch", () => {
  const icon = { name: "new-app-icon" };
  const calls = [];
  const dock = { setIcon: (value) => calls.push(value) };

  assert.equal(setDockIcon({ platform: "darwin", dock, icon }), true);
  assert.deepEqual(calls, [icon]);
});

test("other platforms do not set a Dock icon", () => {
  const calls = [];
  const dock = { setIcon: (value) => calls.push(value) };

  assert.equal(setDockIcon({ platform: "win32", dock, icon: {} }), false);
  assert.deepEqual(calls, []);
});
