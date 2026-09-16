const assert = require('node:assert/strict');
const {fence, safeText, renderMarkdown, collectEvents} = require('./exporter.js');

(async () => {
  const event = n => ({event_id: `id-${n}`, sequence_num: String(n), event_type: 'user', created_at: '2026-09-16T00:00:00Z', payload: {message: {content: [{type: 'text', text: `Message ${n}\n\n\`\`\`js\ncode()\n\`\`\``}]}}});
  const pages = [{data: [event(3), event(2)], next_cursor: '2'}, {data: [event(2), event(1)], next_cursor: null}];
  const cursors = [];
  const result = await collectEvents(async cursor => {cursors.push(cursor); return pages.shift();}, () => {});
  assert.deepEqual(cursors, [undefined, '2']);
  assert.deepEqual(result.map(e => e.sequence_num), ['1', '2', '3']);
  const md = renderMarkdown(result, 'https://claude.ai/code/session_test', 'Test');
  for (const e of result) {
    assert.ok(md.includes(e.payload.message.content[0].text));
    assert.ok(md.includes(JSON.stringify(e, null, 2)));
  }
  assert.ok(fence('```\ninside\n```').startsWith('````\n'));
  assert.equal(safeText('<img src="https://example.com/pixel"> ![x](https://example.com/pixel)'), '&lt;img src="https://example.com/pixel"&gt; \\![x](https://example.com/pixel)');
  assert.doesNotThrow(() => renderMarkdown([{...event(1), payload: {message: {content: [null]}}}], 'https://claude.ai/code/session_test', 'Test'));
  await assert.rejects(collectEvents(async () => ({data: [event(1)], next_cursor: 'repeat'}), () => {}), /repeated/);
  await assert.rejects(collectEvents(async () => ({data: [event(1), event(3)]}), () => {}), /incomplete/);
  await assert.rejects(collectEvents(async () => ({data: [event(2)]}), () => {}), /incomplete/);
  await assert.rejects(collectEvents(async () => ({data: []}), () => {}), /no events/);
  await assert.rejects(collectEvents(async () => ({}), () => {}), /unexpected/);
  console.log('Passed: pagination, overlap deduplication, ordering, content preservation, code fences, and incomplete-history failures.');
})().catch(error => {console.error(error); process.exitCode = 1;});
