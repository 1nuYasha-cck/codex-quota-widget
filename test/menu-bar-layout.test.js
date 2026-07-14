const test = require("node:test");
const assert = require("node:assert/strict");
const { MENU_BAR_POPOVER_SIZE } = require("../src/main/menu-bar-layout");

test("menu bar popover uses the narrow ChatGPT-style dimensions", () => {
  assert.deepEqual(MENU_BAR_POPOVER_SIZE, { width: 216, height: 390 });
});
