# ChatGPT Quota

<p align="center">
  <a href="README.md">中文说明</a> | English README
</p>

<p align="center">
  <img src="assets/readme-hero.svg" alt="ChatGPT Quota preview" width="880" />
</p>

<p align="center">
  <img src="assets/icon.png" alt="ChatGPT Quota cat-ear icon" width="88" /><br />
  <strong>A compact Windows and Apple Silicon Mac widget for monitoring your local Codex quota.</strong><br />
  It adds a persistent percentage to the Mac menu bar, fast Windows tray controls, and a compact desktop quota panel.
</p>

<p align="center">
  <a href="#release-download">Release Download</a> ·
  <a href="#features">Features</a> ·
  <a href="#privacy-and-security">Privacy</a> ·
  <a href="#development">Development</a>
</p>

## Release Download

The latest stable release is `v1.3.1`, with Windows and Apple Silicon Mac packages in the same GitHub Release:

[Download ChatGPT Quota v1.3.1](https://github.com/1nuYasha-cck/codex-quota-widget/releases/tag/v1.3.1)

Download the Windows portable `.exe`, or download `mac-arm64.zip` for an Apple Silicon Mac. Both builds are currently unsigned, so the operating system may require manual approval on first launch.

## Overview

ChatGPT Quota reads quota snapshots from your locally installed Codex application and presents them in a small floating desktop widget. It is designed for Windows and Apple Silicon Mac users who want quick visibility into remaining Codex usage without keeping the full Codex app in focus.

The project is inspired by the desktop-widget idea in `xicunwus2025-sys/codex-led-widget`, but the repository identity, README content, visuals, Codex path handling, and privacy notes have been rewritten for this project.

## Preview

<p align="center">
  <img src="assets/readme-flow.svg" alt="ChatGPT Quota data flow" width="880" />
</p>

## Mac and Windows Features

<p align="center">
  <img src="assets/platform-features-en.svg" alt="ChatGPT Quota Mac and Windows feature comparison" width="880" />
</p>

| Platform | Platform-specific experience | Release format |
| --- | --- | --- |
| Apple Silicon Mac | Menu bar icon and remaining percentage; switchable 7-day/5-hour source; dedicated settings popover; menu bar stays active after the widget is closed and the Dock icon hides automatically | ARM64 `.zip` containing the `.app` |
| Windows x64 | Left-click tray toggle; native right-click settings menu; always-on-top, startup, and refresh interval controls; no installer required | Portable `.exe` |

### Mac

- Keeps the cat-ear icon and selected remaining percentage visible in the menu bar.
- Lets the menu bar percentage follow either the 7-day or 5-hour quota and remembers the choice.
- Opens a dedicated settings popover from the menu bar icon.
- Closing the floating widget hides it while the menu bar process remains active, and automatically hides the Dock icon in the background.
- Ships as a native Apple Silicon ARM64 build for M-series Macs.

### Windows

- Left-clicking the system tray icon shows or hides the floating widget.
- Right-clicking opens the native tray menu for refresh, pinning, startup, and refresh interval settings.
- Ships as a portable x64 executable with no installation step.
- Keeps the widget out of the taskbar and continues running from the tray when hidden.

## Features

- Lets you independently show or hide the 5-hour quota, 7-day quota, and liquid meter.
- Lets the liquid meter follow either quota window and remembers the selection.
- Displays the current plan type, such as `PLUS`.
- Reads today's token usage from local `.codex/sessions` logs.
- Supports always-on-top mode, tray hiding, startup launch, and configurable refresh intervals.
- Supports free edge resizing and remembers the last window size.
- Scales the meter, cards, controls, spacing, and type together with the window.
- Keeps only More, Hide, and Quit in the title bar; refresh, pin, language, and display controls live in the More menu.
- Uses clear meter thresholds: green at 40% or above, orange below 40%, red below 20%, and blue while loading.

## Local Codex Path

The widget prefers the current local Codex installation:

```txt
%LOCALAPPDATA%\OpenAI\Codex\bin\<version-hash>\codex.exe
```

The widget tries the current Codex Desktop installation first, then global npm, pnpm, Bun, and `PATH` CLI installations.

## Privacy and Security

- No Codex token input is required.
- Authentication tokens are not read, saved, printed, or uploaded.
- `.env`, `.codex`, logs, caches, build outputs, and local credential files are excluded from Git.
- Quota reads use your existing local Codex sign-in state.
- Today's token summary only reads usage fields from local session logs.

## Installation

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Build the Windows portable executable:

```bash
npm run build
```

The output executable is generated at:

```txt
dist/ChatGPT-Quota-1.3.1-win-x64.exe
```

Build the Apple Silicon Mac package on macOS:

```bash
npm run build:mac
```

The app is generated under `dist/ChatGPT Quota-darwin-arm64/`.

## Development

```bash
git clone https://github.com/1nuYasha-cck/codex-quota-widget.git
cd codex-quota-widget
npm install
npm run dev
```

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Electron in development mode |
| `npm start` | Start the app |
| `npm run build` | Build the Windows portable exe |
| `npm run build:dir` | Generate the unpacked Windows app directory |
| `npm run build:mac` | Build the Apple Silicon Mac ARM64 app |

## License

MIT License
