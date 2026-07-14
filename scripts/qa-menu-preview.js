const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const bundleRoot = path.join(projectRoot, "dist/mac-arm64/ChatGPT Quota.app/Contents/Resources/app.asar");
const outputPath = process.argv[2] || "/tmp/chatgpt-quota-menu-preview.png";
const sampleState = {
  quotaSource: "weekly",
  refreshing: false,
  widgetVisible: true,
  autoLaunch: false,
  refreshIntervalMinutes: 1,
  quota: {
    fetchedAt: new Date().toISOString(),
    fiveHour: null,
    weekly: { remainingPercent: 6 }
  }
};

ipcMain.handle("menu-bar:get-state", () => sampleState);
ipcMain.handle("menu-bar:action", () => sampleState);

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 216,
    height: 390,
    frame: false,
    transparent: true,
    show: false,
    webPreferences: {
      preload: path.join(bundleRoot, "src/main/preload-menu-bar.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await window.loadFile(path.join(bundleRoot, "src/renderer/menu-bar.html"));
  await new Promise((resolve) => setTimeout(resolve, 250));
  const bounds = await window.webContents.executeJavaScript(`(() => {
    const popover = document.querySelector('.popover').getBoundingClientRect();
    const quit = document.querySelector('.quit-row').getBoundingClientRect();
    return { popoverBottom: popover.bottom, quitBottom: quit.bottom, bottomGap: popover.bottom - quit.bottom };
  })()`);
  fs.writeFileSync(outputPath, (await window.webContents.capturePage()).toPNG());
  console.log(JSON.stringify({ outputPath, bounds }));
  app.quit();
});
