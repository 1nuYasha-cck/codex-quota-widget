const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");

const DEFAULT_TIMEOUT_MS = 20000;
const TOKEN_CACHE_TTL_MS = 60_000;

let quotaRequest = null;
let tokenCache = null;

function resolveCodexCandidates(env = process.env, platform = process.platform) {
  const localAppData = env.LOCALAPPDATA || "";
  const appData = env.APPDATA || path.join(env.USERPROFILE || "", "AppData", "Roaming");
  const home = env.HOME || env.USERPROFILE || os.homedir();
  const isWindows = platform === "win32";
  const candidates = (isWindows
    ? [
        env.CODEX_CLI_PATH,
        ...findLocalCodexBins(localAppData),
        safeJoin(localAppData, "OpenAI", "Codex", "bin", "codex.exe"),
        safeJoin(localAppData, "OpenAI", "Codex", "app", "resources", "codex.exe"),
        safeJoin(localAppData, "Programs", "Codex", "resources", "codex.exe"),
        safeJoin(appData, "npm", "codex.cmd"),
        safeJoin(localAppData, "pnpm", "codex.cmd"),
        safeJoin(home, ".bun", "bin", "codex.exe"),
        ...findOnPath(["codex.exe", "codex.cmd"], env),
        "codex"
      ]
    : [
        env.CODEX_CLI_PATH,
        safeJoin("/Applications", "ChatGPT.app", "Contents", "Resources", "codex"),
        safeJoin(home, "Applications", "ChatGPT.app", "Contents", "Resources", "codex"),
        safeJoin("/Applications", "Codex.app", "Contents", "Resources", "codex"),
        safeJoin(home, "Applications", "Codex.app", "Contents", "Resources", "codex"),
        safeJoin(home, ".local", "bin", "codex"),
        safeJoin(home, ".npm-global", "bin", "codex"),
        safeJoin(home, "Library", "pnpm", "codex"),
        safeJoin(home, ".bun", "bin", "codex"),
        "/opt/homebrew/bin/codex",
        "/usr/local/bin/codex",
        ...findOnPath(["codex"], env, ":"),
        "codex"
      ])
    .filter(Boolean)
    .filter(isAllowedCodexPath);

  return uniquePaths(candidates).filter((candidate) => candidate === "codex" || fs.existsSync(candidate));
}

async function getQuota() {
  if (quotaRequest) return quotaRequest;
  quotaRequest = readQuota();
  try {
    return await quotaRequest;
  } finally {
    quotaRequest = null;
  }
}

async function readQuota() {
  const todayTokensPromise = getCachedTodayTokenUsage();

  try {
    const response = await requestRateLimits();
    const snapshot =
      response.rateLimitsByLimitId?.codex ||
      response.rateLimits ||
      firstSnapshot(response.rateLimitsByLimitId);

    if (!snapshot) {
      throw new Error("Codex did not return a rate-limit snapshot.");
    }

    return {
      ...normalizeSnapshot(snapshot),
      todayTokens: await todayTokensPromise
    };
  } catch (error) {
    return {
      limitId: "codex",
      limitName: "Codex",
      planType: null,
      reachedType: null,
      credits: null,
      fiveHour: null,
      weekly: null,
      remainingPercent: null,
      usedPercent: null,
      resetsAt: null,
      fetchedAt: new Date().toISOString(),
      quotaError: error?.message || String(error),
      todayTokens: await todayTokensPromise
    };
  }
}

function safeJoin(root, ...parts) {
  return root ? path.join(root, ...parts) : null;
}

function findOnPath(commands, env = process.env, delimiter = path.delimiter) {
  const pathValue = env.PATH || env.Path || "";
  const directories = pathValue.split(delimiter).filter(Boolean);
  const matches = [];
  for (const directory of directories) {
    for (const command of commands) {
      const candidate = path.join(directory.replace(/^"|"$/g, ""), command);
      if (fs.existsSync(candidate)) matches.push(candidate);
    }
  }
  return matches;
}

function findLocalCodexBins(localAppData) {
  if (!localAppData) return [];
  const root = path.join(localAppData, "OpenAI", "Codex", "bin");
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const candidates = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, "codex.exe"))
    .filter((candidate) => fs.existsSync(candidate))
    .map((candidate) => ({ candidate, mtimeMs: fs.statSync(candidate).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates.map(({ candidate }) => candidate);
}

function isAllowedCodexPath(candidate) {
  const normalized = path.normalize(candidate).toLowerCase();
  return !normalized.includes(`${path.sep}downloads${path.sep}codex-msix-repack${path.sep}`);
}

function uniquePaths(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = path.normalize(candidate).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function firstSnapshot(map) {
  if (!map || typeof map !== "object") return null;
  const firstKey = Object.keys(map)[0];
  return firstKey ? map[firstKey] : null;
}

function normalizeSnapshot(snapshot) {
  const windows = [snapshot.primary, snapshot.secondary].filter(Boolean);
  const weeklySource = windows.find((window) => Number(window.windowDurationMins) >= 7 * 24 * 60) ||
    (snapshot.secondary && !isFiveHourWindow(snapshot.secondary) ? snapshot.secondary : null) ||
    (snapshot.primary && !isFiveHourWindow(snapshot.primary) ? snapshot.primary : null);
  const fiveHourSource = windows.find(isFiveHourWindow) ||
    (snapshot.primary && snapshot.primary !== weeklySource ? snapshot.primary : null);
  const fiveHour = normalizeWindow(fiveHourSource);
  const weekly = normalizeWindow(weeklySource);
  const activeWindow = weekly || fiveHour;

  return {
    limitId: snapshot.limitId || "codex",
    limitName: snapshot.limitName || "Codex",
    planType: snapshot.planType || "unknown",
    reachedType: snapshot.rateLimitReachedType || null,
    credits: snapshot.credits || null,
    fiveHour,
    weekly,
    remainingPercent: activeWindow ? activeWindow.remainingPercent : null,
    usedPercent: activeWindow ? activeWindow.usedPercent : null,
    resetsAt: activeWindow ? activeWindow.resetsAt : null,
    fetchedAt: new Date().toISOString()
  };
}

function isFiveHourWindow(window) {
  const duration = Number(window?.windowDurationMins);
  return Number.isFinite(duration) && duration > 0 && duration < 24 * 60;
}

function normalizeWindow(window) {
  if (!window) return null;
  const rawUsedPercent = Number(window.usedPercent);
  if (!Number.isFinite(rawUsedPercent)) return null;
  const usedPercent = clampPercent(rawUsedPercent);
  return {
    usedPercent,
    remainingPercent: clampPercent(100 - usedPercent),
    windowDurationMins: window.windowDurationMins ?? null,
    resetsAt: window.resetsAt ? new Date(window.resetsAt * 1000).toISOString() : null
  };
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function getTodayTokenUsage(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  const totals = {
    totalTokens: 0,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    events: 0,
    source: "codex-session-logs",
    date: formatLocalDate(start),
    available: false
  };

  const files = await listSessionFilesForRange(start, end);
  for (const file of files) {
    await addTokenUsageFromFile(file, start, end, totals);
  }

  totals.available = totals.events > 0;
  return totals;
}

async function getCachedTodayTokenUsage() {
  const now = Date.now();
  if (tokenCache && now - tokenCache.createdAt < TOKEN_CACHE_TTL_MS) {
    return tokenCache.value;
  }
  const value = await getTodayTokenUsage();
  tokenCache = { createdAt: now, value };
  return value;
}

async function listSessionFilesForRange(start, end) {
  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  const sessionRoot = path.join(process.env.CODEX_HOME || path.join(home, ".codex"), "sessions");
  const days = uniquePathDays([
    formatPathDay(start),
    formatPathDay(end),
    formatUtcPathDay(start),
    formatUtcPathDay(end)
  ]);
  const files = [];

  for (const day of days) {
    const dir = path.join(sessionRoot, day.year, day.month, day.day);
    let entries;
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  return files;
}

function uniquePathDays(days) {
  const seen = new Set();
  return days.filter((day) => {
    const key = `${day.year}-${day.month}-${day.day}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatPathDay(date) {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0")
  };
}

function formatUtcPathDay(date) {
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    day: String(date.getUTCDate()).padStart(2, "0")
  };
}

function formatLocalDate(date) {
  const day = formatPathDay(date);
  return `${day.year}-${day.month}-${day.day}`;
}

async function addTokenUsageFromFile(file, start, end, totals) {
  const stream = fs.createReadStream(file, { encoding: "utf8" });
  stream.on("error", () => {});

  const lines = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  for await (const line of lines) {
    if (!line.includes('"token_count"')) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const timestamp = new Date(entry.timestamp);
    if (!Number.isFinite(timestamp.getTime()) || timestamp < start || timestamp >= end) continue;
    if (entry.type !== "event_msg" || entry.payload?.type !== "token_count") continue;

    const usage = entry.payload.info?.last_token_usage;
    if (!usage) continue;

    totals.totalTokens += numberOrZero(usage.total_tokens);
    totals.inputTokens += numberOrZero(usage.input_tokens);
    totals.cachedInputTokens += numberOrZero(usage.cached_input_tokens);
    totals.outputTokens += numberOrZero(usage.output_tokens);
    totals.reasoningOutputTokens += numberOrZero(usage.reasoning_output_tokens);
    totals.events += 1;
  }
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

async function requestRateLimits() {
  const candidates = resolveCodexCandidates();
  const failures = [];

  for (const candidate of candidates) {
    try {
      return await requestRateLimitsFrom(candidate);
    } catch (error) {
      failures.push(error?.message || String(error));
    }
  }

  const relevantError = failures.find((message) => !/ENOENT|not found|cannot find/i.test(message));
  const finalError = relevantError || failures.at(-1) || "Codex executable was not found.";
  throw new Error(`Tried ${candidates.length} Codex installation path(s). ${finalError}`);
}

function createSpawnSpec(candidate) {
  if (process.platform === "win32" && /\.(cmd|bat)$/i.test(candidate)) {
    return {
      command: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", `call "${candidate}" app-server --listen stdio://`]
    };
  }
  return { command: candidate, args: ["app-server", "--listen", "stdio://"] };
}

function requestRateLimitsFrom(candidate) {
  const spawnSpec = createSpawnSpec(candidate);
  const child = spawn(spawnSpec.command, spawnSpec.args, {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true
  });

  let buffer = "";
  let stderr = "";
  let nextId = 1;
  let settled = false;
  const pending = new Map();

  const cleanup = () => {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
    }
    pending.clear();
    if (!child.killed) child.kill();
  };

  const send = (method, params) => {
    const id = nextId++;
    const payload = params === undefined ? { id, method } : { id, method, params };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Codex request timed out: ${method}`));
      }, DEFAULT_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      child.stdin.write(`${JSON.stringify(payload)}\n`, (error) => {
        if (!error) return;
        clearTimeout(timer);
        pending.delete(id);
        reject(error);
      });
    });
  };

  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;
      handleMessage(line, pending);
    }
  });

  child.stderr.on("data", (chunk) => {
    stderr = (stderr + chunk.toString("utf8")).slice(-8192);
  });

  return new Promise((resolve, reject) => {
    const fail = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    child.once("error", (error) => {
      fail(error);
    });

    child.once("exit", (code) => {
      if (!settled) fail(new Error(stderr || `Codex app-server exited with code ${code}`));
    });

    (async () => {
      try {
        await send("initialize", {
          clientInfo: {
            name: "chatgpt-quota",
            title: "ChatGPT Quota",
            version: "1.3.1"
          },
          capabilities: null
        });
        const result = await send("account/rateLimits/read");
        settled = true;
        cleanup();
        resolve(result);
      } catch (error) {
        const details = [error?.message, stderr.trim()].filter(Boolean);
        fail(new Error([...new Set(details)].join(" | ")));
      }
    })();
  });
}

function handleMessage(line, pending) {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(message, "id")) return;
  const request = pending.get(message.id);
  if (!request) return;

  clearTimeout(request.timer);
  pending.delete(message.id);

  if (message.error) {
    request.reject(new Error(message.error.message || JSON.stringify(message.error)));
  } else {
    request.resolve(message.result);
  }
}

module.exports = {
  getQuota,
  normalizeSnapshot,
  getTodayTokenUsage,
  resolveCodexCandidates,
  createSpawnSpec
};
