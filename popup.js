document.querySelector('#download').addEventListener('click', async () => {
  const button = document.querySelector('#download');
  const status = document.querySelector('#status');
  button.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const url = new URL(tab?.url || 'about:blank');
    if (url.origin !== 'https://claude.ai' || !/^\/code\/(?:session|cse)_[A-Za-z0-9]+\/?$/.test(url.pathname)) {
      throw new Error('Open a Claude Code session at claude.ai/code/session_… first.');
    }
    await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['exporter.js']});
    status.textContent = 'Export started. Progress appears in the Claude tab. You can close this popup.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
