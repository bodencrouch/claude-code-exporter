# Privacy policy

Effective September 16, 2026

Claude Code Exporter reads the Claude Code session in the tab where you invoke it and turns that session into a Markdown file on your computer.

The extension communicates with `claude.ai` to retrieve the session you request. It does not send session data to the developer, analytics providers, advertisers, or other third parties. It has no analytics, ads, remote server, or account system. It does not store your Claude credentials or conversation history in extension storage.

## Browser access

The extension requests two browser permissions:

- `activeTab` grants temporary access to the tab where you click the extension.
- `scripting` lets the extension run the exporter in that tab after you ask it to.

The exporter uses your existing Claude sign-in to request the selected session's paginated history from `claude.ai`. It processes that history in the tab and creates a local Markdown download. Data does not pass through a server operated by this project or its author.

## Data retention

The extension holds session data in the Claude tab's memory while it builds the export. It uses no persistent extension storage. A temporary browser Blob URL remains valid for up to 60 seconds after the download request, then the extension revokes it. Your browser and operating system control the downloaded file, browser history, cache, and any copies you create.

## Changes

Material changes to this policy will be recorded in this repository before a new extension version is published.

## Contact

Questions and privacy reports can be filed through [GitHub Issues](https://github.com/bodencrouch/claude-code-exporter/issues) or the contact options at [bodecloud.com](https://bodecloud.com).

Claude is a trademark of Anthropic. This project is independent and is not affiliated with Anthropic.
