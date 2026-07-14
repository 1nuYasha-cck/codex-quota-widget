const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const packageJson = require("../package.json");

test("Windows portable build is x64 and uses the unified icon", () => {
  assert.equal(packageJson.build.win.icon, "assets/icon.ico");
  assert.deepEqual(packageJson.build.win.target, [{ target: "portable", arch: ["x64"] }]);
  assert.equal(packageJson.build.portable.artifactName, "ChatGPT-Quota-${version}-win-x64.exe");

  const iconHeader = fs.readFileSync(path.join(__dirname, "../assets/icon.ico")).subarray(0, 4);
  assert.deepEqual([...iconHeader], [0, 0, 1, 0]);
});
