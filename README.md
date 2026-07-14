# ChatGPT Quota

<p align="center">
  中文说明 | <a href="README_EN.md">English README</a>
</p>

<p align="center">
  <img src="assets/readme-hero.svg" alt="ChatGPT Quota 产品预览" width="880" />
</p>

<p align="center">
  <img src="assets/icon.png" alt="ChatGPT Quota 猫耳图标" width="88" /><br />
  <strong>一个面向 Windows 与 Apple Silicon Mac 的 Codex 剩余额度桌面小组件。</strong><br />
  Mac 菜单栏常驻百分比，Windows 托盘快速操作；悬浮窗集中显示 5 小时、7 天额度与今日 Token 用量。
</p>

<p align="center">
  <a href="#核心功能">核心功能</a> ·
  <a href="#release-下载">Release 下载</a> ·
  <a href="#隐私与安全">隐私与安全</a> ·
  <a href="#本地开发">本地开发</a> ·
  <a href="#常见问题">常见问题</a>
</p>

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS-2563eb?style=for-the-badge" />
  <img alt="Electron" src="https://img.shields.io/badge/Electron-43-111827?style=for-the-badge" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-16a34a?style=for-the-badge" />
</p>

---

## 项目定位

ChatGPT Quota 是一个轻量级桌面工具，用来快速查看本机 Codex 账号的使用额度状态。它不要求你手动输入 Token，也不会上传额度数据；它通过本机已安装的 Codex 程序读取官方客户端可访问的额度快照，并把信息整理成一个紧凑的悬浮窗。

这个项目参考了 `xicunwus2025-sys/codex-led-widget` 的小组件方向，但做了重新开发。

## Release 下载

最新稳定版为 `v1.3.1`，Windows 与 Apple Silicon Mac 包位于同一个 GitHub Release：

[下载 ChatGPT Quota v1.3.1](https://github.com/1nuYasha-cck/codex-quota-widget/releases/tag/v1.3.1)

Windows 下载 `.exe` 后双击运行；Apple Silicon Mac 下载 `mac-arm64.zip` 后解压并打开 `.app`。两个版本均未做代码签名，系统出现安全提示时请确认来源后手动放行。

## 界面预览

<p align="center">
  <img src="assets/readme-flow.svg" alt="ChatGPT Quota 数据流程与界面说明" width="880" />
</p>

## Mac 与 Windows 特性

<p align="center">
  <img src="assets/platform-features.svg" alt="ChatGPT Quota Mac 与 Windows 特性对照" width="880" />
</p>

| 平台 | 独有体验 | 发布格式 |
| --- | --- | --- |
| Apple Silicon Mac | 菜单栏显示猫耳图标与剩余额度；可选择 7 天或 5 小时；点击图标打开专属设置面板；关闭悬浮窗后菜单栏继续运行且 Dock 图标自动隐藏 | ARM64 `.zip`，解压得到 `.app` |
| Windows x64 | 托盘左键显示/隐藏小组件；右键打开原生设置菜单；支持置顶、开机启动和刷新间隔；免安装直接运行 | Portable `.exe` |

### Mac 版

- 顶部菜单栏常驻显示“猫耳图标 + 剩余额度百分比”。
- 百分比来源可在 `7天` 与 `5小时` 之间切换并自动保存。
- 点击菜单栏图标可进行刷新、显示/隐藏、开机启动、刷新间隔和退出设置。
- 点击小组件关闭按钮只隐藏窗口，不退出菜单栏程序；后台运行时 Dock 图标自动隐藏。
- 当前提供 Apple Silicon ARM64 构建，适用于 M 系列 Mac。

### Windows 版

- 左键点击系统托盘图标即可显示或隐藏悬浮窗。
- 右键托盘图标打开设置菜单，包括刷新、置顶、开机启动和刷新间隔。
- 提供免安装 x64 便携版，不写入系统安装目录。
- 小组件保持 `skipTaskbar`，隐藏后继续在托盘运行。

小组件默认放在屏幕右上角，窗口无边框、透明背景、体积较小，不会挡住主要开发区域。颜色会跟随额度状态变化：

| 状态 | 颜色 | 说明 |
| --- | --- | --- |
| 正常 | 绿色 | 水位所选额度剩余 40% 或以上 |
| 偏低 | 橙色 | 水位所选额度低于 40% |
| 紧张/用尽 | 红色 | 水位所选额度低于 20% |
| 读取中 | 蓝色 | 正在从本机 Codex 读取快照 |
| 失败 | 红色 | 本机 Codex 路径、登录态或读取过程异常 |

## 核心功能

### 1. 额度一眼可见

- 可分别显示或隐藏 5 小时额度、7 天额度和水位仪表。
- 水位仪表可选择跟随 5 小时或 7 天额度，并记住选择。
- 显示当前计划类型，例如 `PLUS`。
- 使用 LED 状态点区分正常、偏低、用尽和读取失败。

### 2. 今日 Token 统计

- 从本机 `.codex/sessions` 会话日志中统计当天 Token 使用量。
- 展示总 Token 数，并在悬停时提供输入、输出、事件数量等细节。
- 只读取本地会话日志，不读取认证 Token。

### 3. 桌面悬浮体验

- 无边框透明窗口，适合放在屏幕角落。
- 可从窗口边缘自由拖动调整大小，并自动记住上次尺寸。
- 调整窗口大小时，仪表、卡片、按钮、间距和字体会同步缩放。
- 标题栏只保留 `···`、隐藏和退出；刷新、置顶、语言及显示选项集中在 `···` 菜单中。
- 支持置顶和取消置顶。
- 支持隐藏到托盘，点击托盘图标可再次显示。
- 支持开机自启动。
- 支持刷新间隔选择：1、5、15、30、60 分钟。

### 4. 本机 Codex 路径优先

当前版本优先读取：

```txt
%LOCALAPPDATA%\OpenAI\Codex\bin\<version-hash>\codex.exe
```

如果桌面版路径不可用，还会依次尝试全局 npm、pnpm、Bun 和系统 `PATH` 中的 Codex CLI。

## 隐私与安全

这个项目的安全边界很明确：

- 不要求输入 Codex Token。
- 不读取、保存、打印或上传认证 Token。
- 额度读取依赖本机 Codex 已有登录状态。
- 今日 Token 统计只来自本机 session 日志里的用量字段。

## 安装与使用

### 下载运行

请在 [Release 下载](#release-下载) 中获取最新 Windows 便携版 `.exe`。

Apple Silicon Mac（M 系列）请下载同一 Release 中的 `mac-arm64.zip`，解压后打开应用。

### 本地运行

```bash
npm install
npm run dev
```

### 打包 exe

```bash
npm run build
```

打包完成后，Windows 便携版会输出到：

```txt
dist/ChatGPT-Quota-1.3.1-win-x64.exe
```

### 打包 Apple Silicon Mac 版本

```bash
npm run build:mac
```

输出目录为 `dist/ChatGPT Quota-darwin-arm64/`；发布压缩包可使用 macOS 的 `ditto -c -k --sequesterRsrc --keepParent` 生成。

## 本地开发

```bash
git clone https://github.com/1nuYasha-cck/codex-quota-widget.git
cd codex-quota-widget
npm install
npm run dev
```

常用命令：

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Electron 开发模式 |
| `npm start` | 启动应用 |
| `npm run build` | 打包 Windows portable exe |
| `npm run build:dir` | 只生成 `win-unpacked` 目录 |
| `npm run build:mac` | 打包 Apple Silicon Mac ARM64 应用 |

## 项目结构

```txt
codex-quota-widget/
├─ assets/              # 图标和 README 展示图
├─ src/
│  ├─ main/             # Electron 主进程、IPC、额度读取
│  └─ renderer/         # 悬浮窗页面、样式和交互
├─ package.json         # 项目配置与打包脚本
├─ package-lock.json    # 依赖锁定文件
└─ README.md
```

## 常见问题

### 为什么小组件显示的额度和 Codex 内部有时不同？

额度快照可能存在刷新延迟。小组件每次刷新都会重新读取本机 Codex 返回的 `usedPercent`，再换算成剩余百分比。如果 Codex 后台刚完成用量结算，刷新后可能出现 1% 左右的变化。

### 会不会把我的 Codex Token 发到 GitHub？

不会。仓库 `.gitignore` 已排除 `.env`、`.codex`、日志、缓存、构建产物和本机配置。代码中也没有读取认证 Token 的逻辑。

### 支持哪些系统？

当前提供 Windows x64 和 Apple Silicon Mac ARM64 版本。Mac 版会自动识别 `/Applications/ChatGPT.app/Contents/Resources/codex` 以及常见的本地 Codex CLI 安装路径；暂不提供 Linux 构建。

## 技术栈

- Electron
- JavaScript
- HTML / CSS
- electron-builder
- Codex `app-server` 本机接口

## 后续计划

- 增加更多紧凑布局。
- 增加状态历史曲线。
- 增加自定义主题色。
- 增加 Releases 自动发布流程。
- 增加更细粒度的错误诊断提示。

## 开源协议

MIT License
