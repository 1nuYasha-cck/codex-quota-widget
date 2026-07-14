const i18n = {
  zh: {
    brand: "\u989d\u5ea6",
    loading: "\u8bfb\u53d6\u4e2d",
    readNormal: "\u8bfb\u53d6\u6b63\u5e38",
    readFailed: "\u8bfb\u53d6\u5931\u8d25",
    unavailable: "\u65e0\u6570\u636e",
    ready: "\u6b63\u5e38",
    warning: "\u504f\u4f4e",
    critical: "\u7d27\u5f20",
    empty: "\u7528\u5c3d",
    error: "\u5931\u8d25",
    remaining: "\u5269\u4f59",
    fiveHour: "5\u5c0f\u65f6",
    weekly: "7\u5929",
    plan: "\u8ba1\u5212",
    todayTokens: "\u4eca\u65e5Token",
    refresh: "\u5237\u65b0",
    hide: "\u9690\u85cf",
    close: "\u9000\u51fa",
    pinOn: "\u53d6\u6d88\u7f6e\u9876",
    pinOff: "\u7f6e\u9876",
    statusLoading: "\u6b63\u5728\u5237\u65b0",
    statusReady: "\u5df2\u66f4\u65b0",
    statusError: "\u989d\u5ea6\u8bfb\u53d6\u5931\u8d25",
    settings: "\u66f4\u591a",
    settingsHint: "\u5feb\u6377\u64cd\u4f5c\u4e0e\u663e\u793a\u8bbe\u7f6e",
    showFiveHour: "5\u5c0f\u65f6\u989d\u5ea6",
    showWeekly: "7\u5929\u989d\u5ea6",
    showLiquid: "\u6c34\u4f4d\u663e\u793a",
    liquidSource: "\u6c34\u4f4d\u4ee3\u8868",
    fiveHourRemaining: "5\u5c0f\u65f6\u5269\u4f59",
    weeklyRemaining: "7\u5929\u5269\u4f59",
    codexNotFound: "\u672a\u627e\u5230 Codex\uff0c\u8bf7\u5148\u5b89\u88c5\u6216\u542f\u52a8 Codex",
    codexBlocked: "Codex \u542f\u52a8\u88ab\u62e6\u622a\uff0c\u8bf7\u5148\u542f\u52a8 Codex \u6216\u68c0\u67e5\u5b89\u5168\u8f6f\u4ef6",
    codexTimeout: "Codex \u54cd\u5e94\u8d85\u65f6\uff0c\u8bf7\u91cd\u542f Codex \u540e\u91cd\u8bd5",
    codexAuth: "Codex \u672a\u767b\u5f55\uff0c\u8bf7\u5148\u5728 Codex \u4e2d\u767b\u5f55",
    noData: "--",
    tokenUnavailable: "\u65e0\u65e5\u5fd7"
  },
  en: {
    brand: "Quota",
    loading: "Loading",
    readNormal: "Read OK",
    readFailed: "Read failed",
    unavailable: "No data",
    ready: "OK",
    warning: "Low",
    critical: "Critical",
    empty: "Empty",
    error: "Failed",
    remaining: "Left",
    fiveHour: "5h",
    weekly: "7d",
    plan: "Plan",
    todayTokens: "Today",
    refresh: "Refresh",
    hide: "Hide",
    close: "Quit",
    pinOn: "Unpin",
    pinOff: "Pin",
    statusLoading: "Refreshing",
    statusReady: "Updated",
    statusError: "Quota read failed",
    settings: "More",
    settingsHint: "Quick actions and display settings",
    showFiveHour: "5-hour quota",
    showWeekly: "7-day quota",
    showLiquid: "Liquid meter",
    liquidSource: "Meter shows",
    fiveHourRemaining: "5h left",
    weeklyRemaining: "7d left",
    codexNotFound: "Codex was not found. Install or start Codex first.",
    codexBlocked: "Codex was blocked. Start Codex first or check security software.",
    codexTimeout: "Codex timed out. Restart Codex and try again.",
    codexAuth: "Codex is not signed in. Sign in to Codex first.",
    noData: "--",
    tokenUnavailable: "No logs"
  }
};

const state = {
  lang: localStorage.getItem("codexQuotaLang") || "zh",
  quota: null,
  error: null,
  loading: false,
  alwaysOnTop: true,
  refreshIntervalMinutes: 5,
  displaySettings: loadDisplaySettings()
};

let refreshTimer = null;

const $ = (id) => document.getElementById(id);

const elements = {
  body: document.body,
  trafficLight: $("trafficLight"),
  brandName: $("brandName"),
  stateText: $("stateText"),
  langBtn: $("langBtn"),
  settingsBtn: $("settingsBtn"),
  settingsPanel: $("settingsPanel"),
  settingsTitle: $("settingsTitle"),
  settingsHint: $("settingsHint"),
  showFiveHourLabel: $("showFiveHourLabel"),
  showWeeklyLabel: $("showWeeklyLabel"),
  showLiquidLabel: $("showLiquidLabel"),
  liquidSourceLabel: $("liquidSourceLabel"),
  showFiveHourInput: $("showFiveHourInput"),
  showWeeklyInput: $("showWeeklyInput"),
  showLiquidInput: $("showLiquidInput"),
  liquidSourceInput: $("liquidSourceInput"),
  liquidFiveHourOption: $("liquidFiveHourOption"),
  liquidWeeklyOption: $("liquidWeeklyOption"),
  pinBtn: $("pinBtn"),
  refreshBtn: $("refreshBtn"),
  minimizeBtn: $("minimizeBtn"),
  closeBtn: $("closeBtn"),
  content: document.querySelector(".content"),
  liquidMeter: $("liquidMeter"),
  liquidFill: $("liquidFill"),
  remaining: $("remaining"),
  remainingLabel: $("remainingLabel"),
  fiveHourCard: $("fiveHourCard"),
  fiveHourLabel: $("fiveHourLabel"),
  fiveHourText: $("fiveHourText"),
  weeklyCard: $("weeklyCard"),
  weeklyLabel: $("weeklyLabel"),
  weeklyText: $("weeklyText"),
  planLabel: $("planLabel"),
  planText: $("planText"),
  todayTokenLabel: $("todayTokenLabel"),
  todayTokenText: $("todayTokenText"),
  statusDot: $("statusDot"),
  statusText: $("statusText")
};

function t(key) {
  return i18n[state.lang][key] || key;
}

function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem("codexQuotaLang", lang);
  render();
}

async function refreshQuota() {
  if (state.loading) return;
  state.loading = true;
  render();

  try {
    state.quota = await window.codexQuota.getQuota();
    state.error = state.quota?.quotaError || null;
  } catch (error) {
    state.quota = null;
    state.error = error?.message || String(error);
  } finally {
    state.loading = false;
    render();
  }
}

function render() {
  const quota = state.quota;
  const selectedWindow = state.displaySettings.liquidSource === "fiveHour" ? quota?.fiveHour : quota?.weekly;
  const percent = selectedWindow?.remainingPercent;
  const healthLevel = state.loading ? "loading" : state.error ? "error" : "ready";
  const liquidLevel = window.WidgetLogic.getLevel(percent, null, false);
  const fiveHourLevel = window.WidgetLogic.getLevel(quota?.fiveHour?.remainingPercent, null, false);
  const weeklyLevel = window.WidgetLogic.getLevel(quota?.weekly?.remainingPercent, null, false);

  elements.body.dataset.state = healthLevel;
  elements.brandName.textContent = "ChatGPT Quota";
  elements.stateText.textContent = state.error ? t("readFailed") : t("readNormal");
  elements.langBtn.textContent = state.lang === "zh" ? "English" : "\u4e2d\u6587";
  elements.settingsBtn.title = t("settings");
  elements.settingsBtn.setAttribute("aria-label", t("settings"));
  elements.settingsTitle.textContent = t("settings");
  elements.settingsHint.textContent = t("settingsHint");
  elements.showFiveHourLabel.textContent = t("showFiveHour");
  elements.showWeeklyLabel.textContent = t("showWeekly");
  elements.showLiquidLabel.textContent = t("showLiquid");
  elements.liquidSourceLabel.textContent = t("liquidSource");
  elements.liquidFiveHourOption.textContent = t("showFiveHour");
  elements.liquidWeeklyOption.textContent = t("showWeekly");
  elements.remainingLabel.textContent = state.displaySettings.liquidSource === "fiveHour" ? t("fiveHourRemaining") : t("weeklyRemaining");
  elements.fiveHourLabel.textContent = t("fiveHour");
  elements.weeklyLabel.textContent = t("weekly");
  elements.planLabel.textContent = t("plan");
  elements.todayTokenLabel.textContent = t("todayTokens");

  elements.pinBtn.classList.toggle("active", state.alwaysOnTop);
  elements.pinBtn.title = state.alwaysOnTop ? t("pinOn") : t("pinOff");
  elements.pinBtn.setAttribute("aria-label", elements.pinBtn.title);
  elements.pinBtn.textContent = elements.pinBtn.title;
  elements.refreshBtn.title = t("refresh");
  elements.refreshBtn.textContent = t("refresh");
  elements.minimizeBtn.title = t("hide");
  elements.closeBtn.title = t("close");

  elements.trafficLight.className = `traffic-light ${healthLevel}`;

  if (state.loading) {
    elements.statusDot.className = "status-dot refreshing";
    elements.statusText.textContent = t("statusLoading");
    elements.statusText.title = "";
  } else if (state.error) {
    elements.statusDot.className = "status-dot error";
    elements.statusText.textContent = formatQuotaError(state.error);
    elements.statusText.title = trimError(state.error, 180);
  } else {
    elements.statusDot.className = "status-dot ready";
    elements.statusText.textContent = quota?.fetchedAt ? `${t("statusReady")} ${formatTime(quota.fetchedAt)}` : t("statusReady");
    elements.statusText.title = "";
  }

  elements.remaining.textContent = typeof percent === "number" ? `${percent}%` : "--%";
  elements.liquidFill.style.height = `${typeof percent === "number" ? percent : 0}%`;
  elements.liquidMeter.dataset.level = liquidLevel;
  elements.fiveHourCard.dataset.level = fiveHourLevel;
  elements.weeklyCard.dataset.level = weeklyLevel;
  elements.fiveHourText.textContent = formatWindow(quota?.fiveHour);
  elements.weeklyText.textContent = formatWindow(quota?.weekly, true);
  elements.planText.textContent = quota?.planType ? quota.planType.toUpperCase() : t("noData");
  elements.todayTokenText.textContent = formatTokens(quota?.todayTokens);
  elements.todayTokenText.title = formatTokenTitle(quota?.todayTokens);

  elements.liquidMeter.hidden = !state.displaySettings.showLiquid;
  elements.fiveHourCard.hidden = !state.displaySettings.showFiveHour;
  elements.weeklyCard.hidden = !state.displaySettings.showWeekly;
  elements.content.classList.toggle("no-meter", !state.displaySettings.showLiquid);
  elements.showFiveHourInput.checked = state.displaySettings.showFiveHour;
  elements.showWeeklyInput.checked = state.displaySettings.showWeekly;
  elements.showLiquidInput.checked = state.displaySettings.showLiquid;
  elements.liquidSourceInput.value = state.displaySettings.liquidSource;
  elements.liquidSourceInput.disabled = !state.displaySettings.showLiquid;
  elements.liquidMeter.setAttribute("aria-label", elements.remainingLabel.textContent);
}

function loadDisplaySettings() {
  try {
    return window.WidgetLogic.normalizeDisplaySettings(JSON.parse(localStorage.getItem("codexQuotaDisplaySettings")));
  } catch {
    return { ...window.WidgetLogic.DEFAULT_DISPLAY_SETTINGS };
  }
}

function saveDisplaySettings() {
  localStorage.setItem("codexQuotaDisplaySettings", JSON.stringify(state.displaySettings));
}

function updateDisplaySettings() {
  state.displaySettings = window.WidgetLogic.normalizeDisplaySettings({
    showFiveHour: elements.showFiveHourInput.checked,
    showWeekly: elements.showWeeklyInput.checked,
    showLiquid: elements.showLiquidInput.checked,
    liquidSource: elements.liquidSourceInput.value
  });
  saveDisplaySettings();
  render();
}

function formatQuotaError(error) {
  const message = String(error || "");
  if (/ENOENT|not found|cannot find|executable was not found/i.test(message)) return t("codexNotFound");
  if (/EPERM|EACCES|access is denied|operation not permitted/i.test(message)) return t("codexBlocked");
  if (/timed out|timeout/i.test(message)) return t("codexTimeout");
  if (/unauthorized|not logged|sign.?in|authentication/i.test(message)) return t("codexAuth");
  return `${t("statusError")}: ${trimError(message, 52)}`;
}

function formatWindow(windowInfo, includeDate = false) {
  if (!windowInfo) return t("noData");
  const reset = windowInfo.resetsAt ? ` ${includeDate ? formatDateTime(windowInfo.resetsAt) : formatTime(windowInfo.resetsAt)}` : "";
  return `${windowInfo.remainingPercent}%${reset}`;
}

function formatTokens(todayTokens) {
  if (!todayTokens?.available) return t("tokenUnavailable");
  return compactNumber(todayTokens.totalTokens);
}

function formatTokenTitle(todayTokens) {
  if (!todayTokens?.available) return t("tokenUnavailable");
  return [
    `Total ${todayTokens.totalTokens.toLocaleString()}`,
    `Input ${todayTokens.inputTokens.toLocaleString()}`,
    `Output ${todayTokens.outputTokens.toLocaleString()}`,
    `Events ${todayTokens.events}`
  ].join(" | ");
}

function compactNumber(value) {
  if (!Number.isFinite(value)) return t("noData");
  if (state.lang === "zh" && value >= 10000) {
    return `${(value / 10000).toFixed(value >= 1000000 ? 0 : 1)}\u4e07`;
  }
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0
  }).format(value);
}

function formatTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return t("noData");
  return new Intl.DateTimeFormat(state.lang === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return t("noData");
  if (state.lang === "zh") {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function trimError(error, length = 80) {
  return String(error).replace(/\s+/g, " ").slice(0, length);
}

function wireEvents() {
  elements.langBtn.addEventListener("click", () => {
    setLanguage(state.lang === "zh" ? "en" : "zh");
  });
  elements.refreshBtn.addEventListener("click", () => {
    closeSettingsPanel();
    refreshQuota();
  });
  elements.settingsBtn.addEventListener("click", () => {
    elements.settingsPanel.hidden = !elements.settingsPanel.hidden;
    elements.settingsBtn.classList.toggle("active", !elements.settingsPanel.hidden);
    elements.settingsBtn.setAttribute("aria-expanded", String(!elements.settingsPanel.hidden));
  });
  elements.showFiveHourInput.addEventListener("change", updateDisplaySettings);
  elements.showWeeklyInput.addEventListener("change", updateDisplaySettings);
  elements.showLiquidInput.addEventListener("change", updateDisplaySettings);
  elements.liquidSourceInput.addEventListener("change", updateDisplaySettings);
  document.addEventListener("pointerdown", (event) => {
    if (elements.settingsPanel.hidden) return;
    if (elements.settingsPanel.contains(event.target) || elements.settingsBtn.contains(event.target)) return;
    closeSettingsPanel();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSettingsPanel();
  });
  window.addEventListener("resize", updateUiScale);
  elements.minimizeBtn.addEventListener("click", () => window.codexQuota.minimize());
  elements.closeBtn.addEventListener("click", () => window.codexQuota.close());
  elements.pinBtn.addEventListener("click", async () => {
    state.alwaysOnTop = await window.codexQuota.setAlwaysOnTop(!state.alwaysOnTop);
    render();
  });
  window.codexQuota.onRefresh(refreshQuota);
  window.codexQuota.onAlwaysOnTopChanged((value) => {
    state.alwaysOnTop = value;
    render();
  });
  window.codexQuota.onRefreshIntervalChanged((value) => {
    state.refreshIntervalMinutes = normalizeRefreshInterval(value);
    scheduleRefresh();
  });
}

function updateUiScale() {
  const widthScale = window.innerWidth / 260;
  const heightScale = window.innerHeight / 192;
  const scale = Math.max(0.72, Math.min(3, Math.min(widthScale, heightScale)));
  document.documentElement.style.setProperty("--ui-scale", scale.toFixed(3));
}

function closeSettingsPanel() {
  elements.settingsPanel.hidden = true;
  elements.settingsBtn.classList.remove("active");
  elements.settingsBtn.setAttribute("aria-expanded", "false");
}

async function init() {
  updateUiScale();
  wireEvents();
  const [alwaysOnTop, refreshIntervalMinutes] = await Promise.all([
    window.codexQuota.getAlwaysOnTop(),
    window.codexQuota.getRefreshIntervalMinutes()
  ]);
  state.alwaysOnTop = alwaysOnTop;
  state.refreshIntervalMinutes = normalizeRefreshInterval(refreshIntervalMinutes);
  render();
  refreshQuota();
  scheduleRefresh();
}

function scheduleRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  refreshTimer = setInterval(refreshQuota, state.refreshIntervalMinutes * 60 * 1000);
}

function normalizeRefreshInterval(value) {
  const minutes = Number(value);
  return [1, 5, 15, 30, 60].includes(minutes) ? minutes : 5;
}

init();
