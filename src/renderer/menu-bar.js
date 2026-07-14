const elements = {
  updatedText: document.getElementById("updatedText"),
  summaryLabel: document.getElementById("summaryLabel"),
  summaryPercent: document.getElementById("summaryPercent"),
  fiveHourPercent: document.getElementById("fiveHourPercent"),
  weeklyPercent: document.getElementById("weeklyPercent"),
  toggleWidgetBtn: document.getElementById("toggleWidgetBtn"),
  toggleWidgetText: document.getElementById("toggleWidgetText"),
  refreshBtn: document.getElementById("refreshBtn"),
  autoLaunchInput: document.getElementById("autoLaunchInput"),
  refreshIntervalInput: document.getElementById("refreshIntervalInput"),
  quotaSources: Array.from(document.querySelectorAll('input[name="quotaSource"]')),
  quitBtn: document.getElementById("quitBtn")
};

let currentState = null;

function formatPercent(windowInfo) {
  return Number.isFinite(windowInfo?.remainingPercent) ? `${windowInfo.remainingPercent}%` : "--%";
}

function formatUpdatedAt(quota, refreshing) {
  if (refreshing) return "正在刷新额度…";
  if (quota?.quotaError) return "额度读取失败";
  const date = new Date(quota?.fetchedAt);
  if (!Number.isFinite(date.getTime())) return "等待首次更新";
  const time = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  return `已更新 ${time}`;
}

function render(state) {
  currentState = state;
  const quota = state?.quota;
  const source = state?.quotaSource === "fiveHour" ? "fiveHour" : "weekly";
  const selectedWindow = quota?.[source];

  document.body.dataset.refreshing = String(Boolean(state?.refreshing));
  elements.updatedText.textContent = formatUpdatedAt(quota, state?.refreshing);
  elements.summaryLabel.textContent = source === "fiveHour" ? "5小时剩余额度" : "7天剩余额度";
  elements.summaryPercent.textContent = formatPercent(selectedWindow);
  elements.summaryPercent.dataset.level = window.WidgetLogic.getLevel(selectedWindow?.remainingPercent, null, false);
  elements.fiveHourPercent.textContent = `5小时 ${formatPercent(quota?.fiveHour)}`;
  elements.weeklyPercent.textContent = `7天 ${formatPercent(quota?.weekly)}`;
  elements.toggleWidgetText.textContent = state?.widgetVisible ? "隐藏小组件" : "显示小组件";
  elements.autoLaunchInput.checked = Boolean(state?.autoLaunch);
  elements.refreshIntervalInput.value = String(state?.refreshIntervalMinutes || 5);
  for (const input of elements.quotaSources) input.checked = input.value === source;
}

async function performAction(action, value) {
  const nextState = await window.codexMenuBar.performAction(action, value);
  if (nextState) render(nextState);
}

elements.toggleWidgetBtn.addEventListener("click", () => performAction("toggle-widget"));
elements.refreshBtn.addEventListener("click", () => performAction("refresh"));
elements.quitBtn.addEventListener("click", () => performAction("quit"));
elements.autoLaunchInput.addEventListener("change", () => performAction("set-auto-launch", elements.autoLaunchInput.checked));
elements.refreshIntervalInput.addEventListener("change", () => performAction("set-refresh-interval", Number(elements.refreshIntervalInput.value)));
for (const input of elements.quotaSources) {
  input.addEventListener("change", () => {
    if (input.checked) performAction("set-quota-source", input.value);
  });
}

window.codexMenuBar.onStateChanged(render);
window.codexMenuBar.getState().then(render);
