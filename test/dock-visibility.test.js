const test = require("node:test");
const assert = require("node:assert/strict");
const { syncDockVisibility } = require("../src/main/dock-visibility");

test("macOS shows the Dock icon while the widget is visible", () => {
  const calls = [];
  const dock = {
    isVisible: () => false,
    show: () => calls.push("show"),
    hide: () => calls.push("hide")
  };

  assert.equal(syncDockVisibility({ platform: "darwin", dock, widgetVisible: true }), true);
  assert.deepEqual(calls, ["show"]);
});

test("macOS leaves the existing Dock item untouched on first display", () => {
  const calls = [];
  const dock = {
    isVisible: () => true,
    show: () => calls.push("show"),
    hide: () => calls.push("hide")
  };

  assert.equal(syncDockVisibility({ platform: "darwin", dock, widgetVisible: true }), true);
  assert.deepEqual(calls, []);
});

test("macOS hides the Dock icon after the widget is hidden", () => {
  const calls = [];
  const dock = {
    isVisible: () => true,
    show: () => calls.push("show"),
    hide: () => calls.push("hide")
  };

  assert.equal(syncDockVisibility({ platform: "darwin", dock, widgetVisible: false }), true);
  assert.deepEqual(calls, ["hide"]);
});

test("other platforms do not change Dock visibility", () => {
  const calls = [];
  const dock = { show: () => calls.push("show"), hide: () => calls.push("hide") };

  assert.equal(syncDockVisibility({ platform: "win32", dock, widgetVisible: false }), false);
  assert.deepEqual(calls, []);
});
