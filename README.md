# Session Exporter for Claude Code

Claude Code has no Markdown export. This extension preserves its paginated session history and source events in one file.

Open a Claude Code session and click **Download Markdown**. The extension walks the complete paginated history, checks for missing event numbers, and saves one readable file. Messages, tool calls, tool results, thinking recorded by the source session, and runtime events all come along. The original JSON for every event sits inside an expandable section when you need the exact record.

It runs in the Claude tab you choose. There is no API key, account handoff, telemetry, or server in the middle.

## Install it

Until the store listings clear review:

1. Download this repository and unzip it.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and choose the folder containing `manifest.json`.
5. Open a signed-in Claude Code session at `https://claude.ai/code/session_…`.
6. Open the extension and click **Download Markdown**.

Keep the Claude tab open while it reads the history. The progress box in that tab has a cancel button. Your browser saves the result in its normal download location.

## What it can read

The extension requests `activeTab` and `scripting`. Chrome grants access only after you click the extension for the current tab. It does not watch your other tabs or store credentials.

The exporter calls the history endpoint used by Claude's own interface. That endpoint is undocumented, so Anthropic can change it. The extension fails closed when a page is missing, repeated, or malformed. It will not quietly hand you half a conversation.

This handles Claude Code sessions under `/code/session_…`. Regular Claude chats under `/chat/` use a different data model and are outside the current scope. Files or text already omitted by Claude cannot be reconstructed. Large sessions create large Markdown files because the readable transcript and original event records are both preserved. The current proof covers a 67.8 MB export; larger sessions remain subject to the browser's available memory.

Read the full [privacy policy](PRIVACY.md).

## Check it

Run:

```sh
node check.cjs
```

There are no dependencies or build step. The check covers pagination, overlap between pages, ordering, incomplete history, and Markdown fences.

Build the store ZIP with `./scripts/package.sh`. The script checks that `manifest.json` is at the archive root.

I also ran the installed extension against a live 9,991-event session. It produced a 67,819,565-byte Markdown file with consecutive event numbers. Its first 9,978 events matched an earlier independent export byte for byte at the event level.

## About

Built by [Boden Crouch](https://bodecloud.com). Bugs and endpoint changes belong in [GitHub Issues](https://github.com/bodencrouch/claude-code-exporter/issues).

Claude is a trademark of Anthropic. This project is independent and is not affiliated with Anthropic.

Released under the [MIT License](LICENSE).
