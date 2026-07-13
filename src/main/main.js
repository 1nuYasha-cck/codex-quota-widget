const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { getQuota } = require("./quota-service");

let mainWindow;
let tray;
let isAlwaysOnTop = true;
let refreshIntervalMinutes = 5;
let windowSize = { width: 260, height: 192 };
let saveWindowSizeTimer;

const REFRESH_INTERVAL_OPTIONS = [1, 5, 15, 30, 60];
const DEFAULT_REFRESH_INTERVAL_MINUTES = 5;

function getIcon() {
  const iconPath = path.join(__dirname, "../../assets/icon.png");
  const image = nativeImage.createFromPath(iconPath);
  return image.isEmpty() ? undefined : image;
}

function createWindow() {
  const icon = getIcon();
  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    // Keep the compact layout usable while allowing the meter to be hidden
    // without leaving an unnecessarily large native window constraint.
    minWidth: 180,
    minHeight: 140,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#00000000",
    icon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep the always-visible Apple Silicon widget responsive when macOS
      // moves it to the background; Windows keeps the lower-power default.
      backgroundThrottling: process.platform !== "darwin",
      v8CacheOptions: "bypassHeatCheckAndEagerCompile"
    }
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  mainWindow.on("resize", () => {
    if (!mainWindow || mainWindow.isMaximized() || mainWindow.isMinimized()) return;
    const { width, height } = mainWindow.getBounds();
    windowSize = { width, height };
    clearTimeout(saveWindowSizeTimer);
    saveWindowSizeTimer = setTimeout(saveSettings, 300);
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow.setSkipTaskbar(true);
    mainWindow.show();
    placeWindowTopRight();
  });
}

function placeWindowTopRight() {
  if (!mainWindow) return;
  const display = screen.getPrimaryDisplay();
  const { width, height } = mainWindow.getBounds();
  const { workArea } = display;
  mainWindow.setBounds({
    x: workArea.x + workArea.width - width - 24,
    y: workArea.y + 24,
    width,
    height
  });
}

function createTray() {
  const icon = getIcon();
  tray = new Tray(icon ? icon.resize({ width: 16, height: 16 }) : nativeImage.createEmpty());
  tray.setToolTip("Codex Quota Widget");
  rebuildTrayMenu();
  tray.on("click", toggleWindow);
}

function rebuildTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示/隐藏", click: toggleWindow },
      { label: "刷新额度", click: () => mainWindow?.webContents.send("quota:refresh") },
      {
        label: isAlwaysOnTop ? "取消置顶" : "置顶",
        click: () => setAlwaysOnTop(!isAlwaysOnTop)
      },
      {
        label: "开机自启动",
        type: "checkbox",
        checked: isAutoLaunchEnabled(),
        click: (item) => setAutoLaunch(item.checked)
      },
      {
        label: "刷新间隔",
        submenu: REFRESH_INTERVAL_OPTIONS.map((minutes) => ({
          label: `${minutes} 分钟`,
          type: "radio",
          checked: refreshIntervalMinutes === minutes,
          click: () => setRefreshIntervalMinutes(minutes)
        }))
      },
      { type: "separator" },
      { label: "退出", click: () => app.quit() }
    ])
  );
}

function getSettingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function loadSettings() {
  try {
    const settings = JSON.parse(fs.readFileSync(getSettingsPath(), "utf8"));
    refreshIntervalMinutes = normalizeRefreshInterval(settings.refreshIntervalMinutes);
    windowSize = normalizeWindowSize(settings.windowSize);
  } catch {
    refreshIntervalMinutes = DEFAULT_REFRESH_INTERVAL_MINUTES;
    windowSize = { width: 260, height: 192 };
  }
}

function saveSettings() {
  fs.writeFileSync(
    getSettingsPath(),
    JSON.stringify(
      {
        refreshIntervalMinutes,
        windowSize
      },
      null,
      2
    )
  );
}

function normalizeWindowSize(value) {
  const width = Math.round(Number(value?.width));
  const height = Math.round(Number(value?.height));
  return {
    width: Number.isFinite(width) ? Math.max(180, Math.min(width, 1600)) : 260,
    height: Number.isFinite(height) ? Math.max(140, Math.min(height, 1200)) : 192
  };
}

function normalizeRefreshInterval(value) {
  const minutes = Number(value);
  return REFRESH_INTERVAL_OPTIONS.includes(minutes) ? minutes : DEFAULT_REFRESH_INTERVAL_MINUTES;
}

function setRefreshIntervalMinutes(minutes) {
  refreshIntervalMinutes = normalizeRefreshInterval(minutes);
  saveSettings();
  mainWindow?.webContents.send("settings:refreshIntervalChanged", refreshIntervalMinutes);
  rebuildTrayMenu();
  return refreshIntervalMinutes;
}

function getAutoLaunchOptions() {
  if (app.isPackaged) {
    return { path: process.execPath, args: [] };
  }
  return { path: process.execPath, args: [app.getAppPath()] };
}

function isAutoLaunchEnabled() {
  try {
    return app.getLoginItemSettings(getAutoLaunchOptions()).openAtLogin;
  } catch {
    return false;
  }
}

function setAutoLaunch(enabled) {
  const options = getAutoLaunchOptions();
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      path: options.path,
      args: options.args
    });
  } finally {
    rebuildTrayMenu();
  }
}

function setAlwaysOnTop(value) {
  isAlwaysOnTop = Boolean(value);
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
    mainWindow.webContents.send("window:alwaysOnTopChanged", isAlwaysOnTop);
  }
  rebuildTrayMenu();
  return isAlwaysOnTop;
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.setSkipTaskbar(true);
    mainWindow.show();
    mainWindow.focus();
  }
}

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createTray();

  ipcMain.handle("quota:get", async () => getQuota());
  ipcMain.handle("settings:refreshInterval:get", () => refreshIntervalMinutes);
  ipcMain.handle("settings:refreshInterval:set", (_event, value) => setRefreshIntervalMinutes(value));
  ipcMain.handle("window:minimize", () => mainWindow?.hide());
  ipcMain.handle("window:close", () => app.quit());
  ipcMain.handle("window:alwaysOnTop:get", () => isAlwaysOnTop);
  ipcMain.handle("window:alwaysOnTop:set", (_event, value) => setAlwaysOnTop(value));
  ipcMain.handle("external:openCodex", () => {
    const codexPath = process.platform === "darwin"
      ? "/Applications/Codex.app"
      : path.join(process.env.LOCALAPPDATA || "", "OpenAI", "Codex");
    shell.openPath(codexPath);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
