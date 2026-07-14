const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { getQuota } = require("./quota-service");
const { syncDockVisibility } = require("./dock-visibility");
const {
  DEFAULT_MENU_BAR_QUOTA_SOURCE,
  normalizeMenuBarQuotaSource,
  formatMenuBarTitle
} = require("./menu-bar-logic");

let mainWindow;
let menuBarWindow;
let tray;
let isAlwaysOnTop = true;
let refreshIntervalMinutes = 5;
let windowSize = { width: 260, height: 192 };
let menuBarQuotaSource = DEFAULT_MENU_BAR_QUOTA_SOURCE;
let latestQuota = null;
let isRefreshingMenuBar = false;
let lastTrayClickAt = 0;
let saveWindowSizeTimer;

const REFRESH_INTERVAL_OPTIONS = [1, 5, 15, 30, 60];
const DEFAULT_REFRESH_INTERVAL_MINUTES = 5;

app.setName("ChatGPT Quota");

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
  mainWindow.on("show", () => {
    syncDockVisibility({ platform: process.platform, dock: app.dock, widgetVisible: true });
    notifyMenuBarStateChanged();
  });
  mainWindow.on("hide", () => {
    // The widget remains available from the macOS menu bar while it runs in
    // the background, so it should not leave a redundant Dock icon behind.
    syncDockVisibility({ platform: process.platform, dock: app.dock, widgetVisible: false });
    notifyMenuBarStateChanged();
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow.setSkipTaskbar(true);
    mainWindow.show();
    placeWindowTopRight();
  });
}

function createMenuBarWindow() {
  if (process.platform !== "darwin") return;
  menuBarWindow = new BrowserWindow({
    width: 330,
    height: 552,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    alwaysOnTop: true,
    hasShadow: true,
    roundedCorners: true,
    type: "panel",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload-menu-bar.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  menuBarWindow.loadFile(path.join(__dirname, "../renderer/menu-bar.html"));
  menuBarWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  menuBarWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  menuBarWindow.on("blur", () => {
    setTimeout(() => {
      if (Date.now() - lastTrayClickAt > 180) menuBarWindow?.hide();
    }, 200);
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
  const iconSize = process.platform === "darwin" ? 18 : 16;
  tray = new Tray(icon ? icon.resize({ width: iconSize, height: iconSize }) : nativeImage.createEmpty());
  tray.setToolTip("ChatGPT Quota");
  if (process.platform === "darwin") {
    createMenuBarWindow();
    updateMenuBarTitle();
    tray.on("click", toggleMenuBarWindow);
    tray.on("right-click", toggleMenuBarWindow);
  } else {
    rebuildTrayMenu();
    tray.on("click", toggleWindow);
  }
}

function rebuildTrayMenu() {
  if (!tray || process.platform === "darwin") return;
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
    menuBarQuotaSource = normalizeMenuBarQuotaSource(settings.menuBarQuotaSource);
  } catch {
    refreshIntervalMinutes = DEFAULT_REFRESH_INTERVAL_MINUTES;
    windowSize = { width: 260, height: 192 };
    menuBarQuotaSource = DEFAULT_MENU_BAR_QUOTA_SOURCE;
  }
}

function saveSettings() {
  fs.writeFileSync(
    getSettingsPath(),
    JSON.stringify(
      {
        refreshIntervalMinutes,
        windowSize,
        menuBarQuotaSource
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
  notifyMenuBarStateChanged();
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
    notifyMenuBarStateChanged();
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
  menuBarWindow?.hide();
  notifyMenuBarStateChanged();
}

function toggleMenuBarWindow() {
  if (!menuBarWindow || !tray) return;
  lastTrayClickAt = Date.now();
  if (menuBarWindow.isVisible()) {
    menuBarWindow.hide();
    return;
  }

  const trayBounds = tray.getBounds();
  const display = screen.getDisplayNearestPoint({
    x: Math.round(trayBounds.x + trayBounds.width / 2),
    y: Math.round(trayBounds.y + trayBounds.height / 2)
  });
  const { width, height } = menuBarWindow.getBounds();
  const minX = display.workArea.x + 8;
  const maxX = display.workArea.x + display.workArea.width - width - 8;
  const x = Math.max(minX, Math.min(maxX, Math.round(trayBounds.x + trayBounds.width / 2 - width / 2)));
  const y = Math.min(
    display.workArea.y + display.workArea.height - height - 8,
    Math.round(trayBounds.y + trayBounds.height + 6)
  );

  menuBarWindow.setPosition(x, y, false);
  notifyMenuBarStateChanged();
  menuBarWindow.show();
  menuBarWindow.focus();
}

function updateLatestQuota(quota) {
  latestQuota = quota;
  updateMenuBarTitle();
  notifyMenuBarStateChanged();
}

function updateMenuBarTitle() {
  if (!tray || process.platform !== "darwin") return;
  tray.setTitle(formatMenuBarTitle(latestQuota, menuBarQuotaSource));
}

function setMenuBarQuotaSource(value) {
  menuBarQuotaSource = normalizeMenuBarQuotaSource(value);
  saveSettings();
  updateMenuBarTitle();
  notifyMenuBarStateChanged();
  return menuBarQuotaSource;
}

function getMenuBarState() {
  return {
    quota: latestQuota,
    quotaSource: menuBarQuotaSource,
    autoLaunch: isAutoLaunchEnabled(),
    refreshIntervalMinutes,
    widgetVisible: Boolean(mainWindow?.isVisible()),
    refreshing: isRefreshingMenuBar
  };
}

function notifyMenuBarStateChanged() {
  if (!menuBarWindow || menuBarWindow.isDestroyed()) return;
  menuBarWindow.webContents.send("menu-bar:state-changed", getMenuBarState());
}

async function refreshFromMenuBar() {
  if (isRefreshingMenuBar) return getMenuBarState();
  isRefreshingMenuBar = true;
  notifyMenuBarStateChanged();

  try {
    const quotaPromise = getQuota();
    mainWindow?.webContents.send("quota:refresh");
    updateLatestQuota(await quotaPromise);
  } finally {
    isRefreshingMenuBar = false;
    notifyMenuBarStateChanged();
  }
  return getMenuBarState();
}

async function handleMenuBarAction(action, value) {
  switch (action) {
    case "toggle-widget":
      toggleWindow();
      break;
    case "refresh":
      return refreshFromMenuBar();
    case "set-quota-source":
      setMenuBarQuotaSource(value);
      break;
    case "set-auto-launch":
      setAutoLaunch(Boolean(value));
      break;
    case "set-refresh-interval":
      setRefreshIntervalMinutes(value);
      break;
    case "quit":
      app.quit();
      return null;
    default:
      throw new Error(`Unsupported menu bar action: ${action}`);
  }
  return getMenuBarState();
}

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createTray();
  syncDockVisibility({ platform: process.platform, dock: app.dock, widgetVisible: mainWindow?.isVisible() });

  ipcMain.handle("quota:get", async () => {
    const quota = await getQuota();
    updateLatestQuota(quota);
    return quota;
  });
  ipcMain.handle("settings:refreshInterval:get", () => refreshIntervalMinutes);
  ipcMain.handle("settings:refreshInterval:set", (_event, value) => setRefreshIntervalMinutes(value));
  ipcMain.handle("window:minimize", () => mainWindow?.hide());
  ipcMain.handle("window:close", () => {
    if (process.platform === "darwin") mainWindow?.hide();
    else app.quit();
  });
  ipcMain.handle("window:alwaysOnTop:get", () => isAlwaysOnTop);
  ipcMain.handle("window:alwaysOnTop:set", (_event, value) => setAlwaysOnTop(value));
  ipcMain.handle("external:openCodex", () => {
    const codexPath = process.platform === "darwin"
      ? "/Applications/Codex.app"
      : path.join(process.env.LOCALAPPDATA || "", "OpenAI", "Codex");
    shell.openPath(codexPath);
  });
  ipcMain.handle("menu-bar:get-state", getMenuBarState);
  ipcMain.handle("menu-bar:action", (_event, action, value) => handleMenuBarAction(action, value));

  app.on("activate", () => {
    if (!mainWindow || mainWindow.isDestroyed()) createWindow();
    else if (!mainWindow.isVisible()) toggleWindow();
  });
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
