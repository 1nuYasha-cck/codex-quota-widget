# Codex Quota Widget

<p align="center">
  <a href="README.md">中文说明</a> | English README
</p>

<p align="center">
  <img src="assets/readme-hero.svg" alt="Codex Quota Widget preview" width="880" />
</p>

<p align="center">
  <strong>A compact Windows desktop widget for monitoring your local Codex quota.</strong><br />
  It keeps the 7-day quota and today's token usage visible in a small desktop panel.
</p>

<p align="center">
  <a href="#release-download">Release Download</a> ·
  <a href="#features">Features</a> ·
  <a href="#privacy-and-security">Privacy</a> ·
  <a href="#development">Development</a>
</p>

## Release Download

The latest stable release is `v1.1.0`:

[Download Codex Quota Widget v1.1.0](https://github.com/1uYasha/codex-quota-widget/releases/tag/v1.1.0)

Download the Windows portable `.exe` from the release page and run it directly. Windows may show an unknown-publisher warning because the app is not code-signed yet.

## Overview

Codex Quota Widget reads quota snapshots from your locally installed Codex application and presents them in a small floating desktop widget. It is designed for Windows users who want quick visibility into remaining Codex usage without keeping the full Codex app in focus.

The project is inspired by the desktop-widget idea in `xicunwus2025-sys/codex-led-widget`, but the repository identity, README content, visuals, Codex path handling, and privacy notes have been rewritten for this project.

## Preview

<p align="center">
  <img src="assets/readme-flow.svg" alt="Codex Quota Widget data flow" width="880" />
</p>

## Features

- Shows remaining quota and reset time for the 7-day window.
- Displays the current plan type, such as `PLUS`.
- Reads today's token usage from local `.codex/sessions` logs.
- Supports always-on-top mode, tray hiding, startup launch, and configurable refresh intervals.
- Supports free edge resizing and remembers the last window size.
- Uses clear status colors: green for healthy, yellow for low, red for empty or failed, and blue for loading.

## Local Codex Path

The widget prefers the current local Codex installation:

```txt
%LOCALAPPDATA%\OpenAI\Codex\bin\<version-hash>\codex.exe
```

The widget uses the current local Codex installation to read quota data.

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
dist/Codex-Quota-Widget-1.0.0-win-x64.exe
```

## Development

```bash
git clone https://github.com/1uYasha/codex-quota-widget.git
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

## License

MIT License
