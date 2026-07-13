const i18n = {
  zh: {
    brand: "\u989d\u5ea6",
    loading: "\u8bfb\u53d6\u4e2d",
    ready: "\u6b63\u5e38",
    warning: "\u504f\u4f4e",
    empty: "\u7528\u5c3d",
    error: "\u5931\u8d25",
    remaining: "\u5269\u4f59",
    weekly: "7\u5929",
    plan: "\u8ba1\u5212",
    todayTokens: "\u4eca\u65e5Token",
    refresh: "\u5237\u65b0",
    hide: "\u9690\u85cf",
    close: "\u9000\u51fa",
    pinOn: "\u53d6\u6d88\u7f6e\u9876",
    pinOff: "\u7f6e\u9876",
    statusLoading: "\u8bfb\u53d6\u4e2d...",
    statusReady: "\u5df2\u66f4\u65b0",
    statusError: "\u989d\u5ea6\u8bfb\u53d6\u5931\u8d25",
    noData: "--",
    tokenUnavailable: "\u65e0\u65e5\u5fd7"
  },
  en: {
    brand: "Quota",
    loading: "Loading",
    ready: "OK",
    warning: "Low",
    empty: "Empty",
    error: "Failed",
    remaining: "Left",
    weekly: "7d",
    plan: "Plan",
    todayTokens: "Today",
    refresh: "Refresh",
    hide: "Hide",
    close: "Quit",
    pinOn: "Unpin",
    pinOff: "Pin",
    statusLoading: "Loading...",
    statusReady: "Updated",
    statusError: "Quota read failed",
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
  refreshIntervalMinutes: 5
};

let refreshTimer = null;

const $ = (id) => document.getElementById(id);

const elements = {
  body: document.body,
  trafficLight: $("trafficLight"),
  brandName: $("brandName"),
  stateText: $("stateText"),
  langBtn: $("langBtn"),
  pinBtn: $("pinBtn"),
  refreshBtn: $("refreshBtn"),
  minimizeBtn: $("minimizeBtn"),
  closeBtn: $("closeBtn"),
  liquidFill: $("liquidFill"),
  remaining: $("remaining"),
  remainingLabel: $("remainingLabel"),
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
  state.error = null;
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
  const percent = quota?.remainingPercent;
  const level = getLevel(percent, state.error, state.loading);

  elements.body.dataset.state = level;
  elements.brandName.textContent = `Codex ${t("brand")}`;
  elements.stateText.textContent = state.loading ? t("loading") : t(level);
  elements.langBtn.textContent = state.lang === "zh" ? "EN" : "\u4e2d";
  elements.remainingLabel.textContent = t("remaining");
  elements.weeklyLabel.textContent = t("weekly");
  elements.planLabel.textContent = t("plan");
  elements.todayTokenLabel.textContent = t("todayTokens");

  elements.pinBtn.classList.toggle("active", state.alwaysOnTop);
  elements.pinBtn.title = state.alwaysOnTop ? t("pinOn") : t("pinOff");
  elements.pinBtn.setAttribute("aria-label", elements.pinBtn.title);
  elements.refreshBtn.title = t("refresh");
  elements.minimizeBtn.title = t("hide");
  elements.closeBtn.title = t("close");

  elements.trafficLight.className = `traffic-light ${level}`;
  elements.statusDot.className = `status-dot ${level}`;

  if (state.loading) {
    elements.statusText.textContent = t("statusLoading");
  } else if (state.error) {
    elements.statusText.textContent = t("statusError");
    elements.statusText.title = trimError(state.error, 180);
  } else {
    elements.statusText.textContent = quota?.fetchedAt ? `${t("statusReady")} ${formatTime(quota.fetchedAt)}` : t("statusReady");
    elements.statusText.title = "";
  }

  elements.remaining.textContent = typeof percent === "number" ? `${percent}%` : "--%";
  elements.liquidFill.style.height = `${typeof percent === "number" ? percent : 0}%`;
  elements.weeklyText.textContent = formatWindow(quota?.weekly, true);
  elements.planText.textContent = quota?.planType ? quota.planType.toUpperCase() : t("noData");
  elements.todayTokenText.textContent = formatTokens(quota?.todayTokens);
  elements.todayTokenText.title = formatTokenTitle(quota?.todayTokens);
}

function getLevel(percent, error, loading) {
  if (loading) return "loading";
  if (error) return "error";
  if (typeof percent !== "number") return "loading";
  if (percent <= 0) return "empty";
  if (percent < 10) return "warning";
  return "ready";
}

function formatWindow(windowInfo, includeDate = false) {
  if (!windowInfo) return t("noData");
  const reset = windowInfo.resetsAt ? ` / ${includeDate ? formatDateTime(windowInfo.resetsAt) : formatTime(windowInfo.resetsAt)}` : "";
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
  elements.refreshBtn.addEventListener("click", refreshQuota);
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

async function init() {
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
