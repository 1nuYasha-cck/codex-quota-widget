const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

test("main and menu renderers share the approved quota palette", () => {
  const widgetStyles = read("src/renderer/styles.css").toLowerCase();
  const menuStyles = read("src/renderer/menu-bar.css").toLowerCase();

  for (const color of ["#34c98f", "#f2b84b", "#ff5c5c"]) {
    assert.match(widgetStyles, new RegExp(color));
    assert.match(menuStyles, new RegExp(color));
  }
});

test("read health stays separate from quota severity", () => {
  const renderer = read("src/renderer/renderer.js");

  assert.match(renderer, /healthLevel = state\.loading \? "loading" : state\.error \? "error" : "ready"/);
  assert.match(renderer, /fiveHourCard\.dataset\.level = fiveHourLevel/);
  assert.match(renderer, /weeklyCard\.dataset\.level = weeklyLevel/);
  assert.match(renderer, /liquidMeter\.dataset\.level = liquidLevel/);
});

test("reset time is separated by whitespace instead of a slash", () => {
  const renderer = read("src/renderer/renderer.js");

  assert.doesNotMatch(renderer, /` \/ \$\{includeDate/);
  assert.match(renderer, /` \$\{includeDate/);
});

test("menu percentage uses shared quota threshold logic", () => {
  const menuHtml = read("src/renderer/menu-bar.html");
  const menuRenderer = read("src/renderer/menu-bar.js");

  assert.match(menuHtml, /widget-logic\.js/);
  assert.match(menuRenderer, /summaryPercent\.dataset\.level = window\.WidgetLogic\.getLevel/);
});
