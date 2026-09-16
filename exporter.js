(() => {
  'use strict';

  function fence(value, language = '') {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    const length = Math.max(3, ...(text.match(/`+/g) || []).map(run => run.length + 1));
    const marker = '`'.repeat(length);
    return `${marker}${language}\n${text}\n${marker}`;
  }

  function safeText(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replace(/!\[/g, '\\![');
  }

  function safeInline(value) {
    return safeText(value).replaceAll('`', '&#96;').replace(/[\r\n]+/g, ' ');
  }

  function renderBlock(block) {
    if (typeof block === 'string') return safeText(block);
    if (!block || typeof block !== 'object') return fence(block, 'json');
    if (block.type === 'text') return safeText(block.text);
    if (block.type === 'thinking') {
      return `<details>\n<summary>Thinking recorded in the source session</summary>\n\n${safeText(block.thinking)}\n\n</details>`;
    }
    if (block.type === 'tool_use' || block.type === 'server_tool_use') {
      return `### Tool call: ${safeInline(block.name)}\n\nTool ID: \`${safeInline(block.id)}\`\n\n${fence(block.input, 'json')}`;
    }
    if (block.type === 'tool_result') {
      const content = Array.isArray(block.content)
        ? block.content.map(renderBlock).join('\n\n') : fence(block.content ?? '');
      return `### Tool result${block.is_error ? ' (error)' : ''}\n\nTool ID: \`${safeInline(block.tool_use_id)}\`\n\n${content}`;
    }
    return fence(block, 'json');
  }

  function renderMarkdown(events, source, title) {
    const first = events[0];
    const last = events.at(-1);
    const parts = [`# ${title.replace(/[\r\n]+/g, ' ')}\n\nSource: ${source}\n\nExported: ${new Date().toISOString()}\n\n` +
      `${events.length.toLocaleString('en-US')} events, sequences ${first.sequence_num}–${last.sequence_num}, ` +
      `from ${first.created_at} to ${last.created_at}. Pagination completed. ` +
      'Messages, tool calls, results, source-recorded thinking, and runtime events are included. ' +
      'Complete source payloads are retained in expandable details. Any truncation already in the source is preserved.\n'];
    for (const event of events) {
      const payload = event.payload;
      const message = payload.message;
      const toolResponse = event.event_type === 'user' && Array.isArray(message?.content) &&
        message.content.length > 0 && message.content.every(block => block?.type === 'tool_result');
      const label = toolResponse ? 'Tool response' : event.event_type;
      parts.push(`\n## ${event.sequence_num}. ${label}\n\nTimestamp: ${event.created_at} · Event ID: \`${event.event_id}\`\n`);
      if (message) {
        parts.push(typeof message.content === 'string' ? safeText(message.content) : (message.content || []).map(renderBlock).join('\n\n'));
      }
      parts.push('\n<details>\n<summary>Complete source event</summary>\n\n' + fence(event, 'json') + '\n\n</details>\n');
    }
    return parts.join('\n');
  }

  async function collectEvents(fetchPage, progress) {
    const events = new Map();
    const cursors = new Set();
    let cursor;
    do {
      const page = await fetchPage(cursor);
      if (!Array.isArray(page.data)) throw new Error('Claude returned an unexpected response. No file was saved.');
      for (const event of page.data) {
        if (!event.event_id || !/^\d+$/.test(String(event.sequence_num)) || !Number.isSafeInteger(Number(event.sequence_num)) ||
            !event.payload || typeof event.payload !== 'object' || typeof event.event_type !== 'string') {
          throw new Error('Claude returned an invalid event. No file was saved.');
        }
        if (events.has(event.event_id) && JSON.stringify(events.get(event.event_id)) !== JSON.stringify(event)) {
          throw new Error('An event changed during export. Retry the download.');
        }
        events.set(event.event_id, event);
      }
      progress(events.size);
      cursor = page.next_cursor;
      if (cursor != null && cursor !== '') {
        if (cursors.has(String(cursor))) throw new Error('Claude repeated a history cursor. No partial file was saved.');
        cursors.add(String(cursor));
      }
    } while (cursor != null && cursor !== '');
    const sorted = [...events.values()].sort((a, b) => Number(a.sequence_num) - Number(b.sequence_num));
    if (!sorted.length) throw new Error('This session has no events to download.');
    for (let index = 0; index < sorted.length; index++) {
      if (Number(sorted[index].sequence_num) !== index + 1) {
        throw new Error(`History is incomplete near sequence ${index + 1}. No partial file was saved.`);
      }
    }
    return sorted;
  }

  async function organizationCandidates(signal) {
    let cookieOrg = '';
    try {
      const cookie = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith('lastActiveOrg='));
      cookieOrg = cookie ? decodeURIComponent(cookie.slice('lastActiveOrg='.length)) : '';
    } catch {}
    const candidates = /^[\da-f-]{36}$/i.test(cookieOrg) ? [cookieOrg] : [];
    try {
      const response = await fetch('/api/organizations', {credentials: 'same-origin', signal});
      if (response.ok) {
        for (const org of await response.json()) {
          const id = org.uuid || org.id;
          if (/^[\da-f-]{36}$/i.test(id) && !candidates.includes(id)) candidates.push(id);
        }
      }
    } catch (error) {
      if (signal.aborted) throw error;
    }
    return candidates;
  }

  async function run() {
    const match = location.pathname.match(/^\/code\/((?:session|cse)_[A-Za-z0-9]+)\/?$/);
    if (location.origin !== 'https://claude.ai' || !match) return;
    if (document.getElementById('claude-code-export-status')) return;
    const session = match[1];
    const source = `${location.origin}/code/${session}`;
    const title = document.querySelector('button[aria-label$=", rename session"]')?.textContent.trim() || session;
    const host = document.createElement('div');
    host.id = 'claude-code-export-status';
    host.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;max-width:calc(100vw - 40px)';
    const shadow = host.attachShadow({mode: 'open'});
    shadow.innerHTML = '<style>:host{font:14px/1.5 system-ui;color:#202020}section{background:#fff;border:1px solid #777;border-radius:8px;padding:16px;max-width:360px;box-shadow:0 3px 18px #0003}p{margin:0 0 10px;overflow-wrap:anywhere}button{font:inherit;padding:6px 12px;cursor:pointer}</style><section aria-label="Export Claude Code"><p role="status" aria-live="polite"></p><button type="button">Cancel export</button></section>';
    document.documentElement.append(host);
    const status = shadow.querySelector('p');
    const button = shadow.querySelector('button');
    const controller = new AbortController();
    button.onclick = () => {controller.abort(); host.remove();};
    try {
      status.textContent = 'Reading session history…';
      const organizations = await organizationCandidates(controller.signal);
      if (!organizations.length) throw new Error('Sign in to Claude and reopen this session, then try again.');
      let selectedOrganization = '';
      const events = await collectEvents(async cursor => {
        const url = new URL(`/v1/code/sessions/${session}/events`, location.origin);
        url.searchParams.set('limit', '500');
        url.searchParams.set('sort_order', 'desc');
        if (cursor != null) url.searchParams.set('cursor', String(cursor));
        let response;
        for (const organization of selectedOrganization ? [selectedOrganization] : organizations) {
          const timeout = new AbortController();
          const stop = () => timeout.abort();
          controller.signal.addEventListener('abort', stop, {once: true});
          const timer = setTimeout(stop, 60000);
          try {
            response = await fetch(url, {
              credentials: 'same-origin', signal: timeout.signal,
              headers: {'x-organization-uuid': organization, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'ccr-byoc-2025-07-29'}
            });
          } finally {
            clearTimeout(timer);
            controller.signal.removeEventListener('abort', stop);
          }
          if (response.ok) {
            selectedOrganization = organization;
            break;
          }
          if (![401, 403, 404].includes(response.status)) break;
        }
        if (!response.ok) {
          const guidance = response.status === 429 ? ' Wait a moment, then try again.' :
            [401, 403, 404].includes(response.status) ? ' Sign in, switch to the session organization, or complete verification in this tab, then try again.' : '';
          throw new Error(`Claude returned HTTP ${response.status}.${guidance} No partial file was saved.`);
        }
        if (!response.headers.get('content-type')?.includes('json')) {
          throw new Error('Claude returned a verification or sign-in page. Complete it in this tab, then try again.');
        }
        return response.json();
      }, count => {status.textContent = `Read ${count.toLocaleString('en-US')} events…`;});
      controller.signal.throwIfAborted();
      status.textContent = `Preparing ${events.length.toLocaleString('en-US')} events…`;
      await new Promise(resolve => setTimeout(resolve, 0));
      controller.signal.throwIfAborted();
      const markdown = renderMarkdown(events, source, title);
      const url = URL.createObjectURL(new Blob([markdown], {type: 'text/markdown;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = `claude-${session}.md`;
      shadow.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status.textContent = `Download requested: ${events.length.toLocaleString('en-US')} events. Check your browser downloads.`;
    } catch (error) {
      if (!controller.signal.aborted) status.textContent = `Export failed: ${error.message}`;
    } finally {
      button.textContent = 'Close';
      button.onclick = () => host.remove();
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {fence, safeText, renderMarkdown, collectEvents};
  else void run();
})();
