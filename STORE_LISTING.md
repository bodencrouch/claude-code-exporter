# Store listing

## Name

Session Exporter for Claude Code

## Summary

Save Claude Code session history as Markdown, including tool calls and results.

## Description

Claude Code has no Markdown export. This extension saves its paginated session history and source events in one file.

Open a Claude Code session, click the extension, and choose Download Markdown. The exporter reads every page in the session history and checks for missing event numbers before it saves anything.

The export includes:

- User and assistant messages
- Tool calls and tool results
- Thinking recorded by the source session
- Runtime events
- The complete source JSON for every event in expandable sections

The extension runs only after you click it in a Claude Code tab. It uses your current Claude sign-in and processes the session in that tab. It has no API key, analytics, ads, developer-operated server, or saved credentials.

Current scope: Claude Code sessions at `claude.ai/code/session_…`. Regular Claude chats are not supported.

Claude is a trademark of Anthropic. This extension is an independent project by Boden Crouch and is not affiliated with Anthropic.

## Category

Developer Tools

## Language

English

## Support URL

https://github.com/bodencrouch/claude-code-exporter/issues

## Homepage

https://github.com/bodencrouch/claude-code-exporter

## Privacy policy

https://github.com/bodencrouch/claude-code-exporter/blob/main/PRIVACY.md

## Single purpose

Download the complete history of the open Claude Code session as a local Markdown file.

## Permission justifications

### activeTab

The extension needs temporary access to the Claude Code tab where the user starts an export. It reads only that selected session after the user clicks the extension.

### scripting

The extension injects the exporter into the selected Claude Code tab so it can use the user's existing signed-in session, read all paginated history, show progress, and create the local download.

## Data-use declaration

The extension handles website content from the selected Claude Code session only to produce the requested local Markdown file. It communicates with `claude.ai` to retrieve that session. It does not transmit session content to the developer or another third party. It does not use session content for advertising, analytics, credit decisions, or any purpose unrelated to the export.

## Reviewer instructions

1. Sign in to an account with access to a Claude Code session.
2. Open a URL matching `https://claude.ai/code/session_…`.
3. Click the extension and choose Download Markdown.
4. Keep the tab open while the progress box counts events.
5. Confirm that a `.md` file downloads and contains sequential event headings.

The production package contains no shared credentials or session data. Review requires a Claude account with access to a Claude Code session. The source repository includes the renderer's runnable fixture check, `node check.cjs`, for review without account data.
