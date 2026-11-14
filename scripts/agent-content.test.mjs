import assert from 'node:assert/strict';
import { test } from 'node:test';
import { htmlToMarkdown } from './html-to-markdown.mjs';
import { createContentHandler, preferredRepresentation } from './agent-content-handler.mjs';

test('negotiation honors explicit exclusions, quality, specificity, and browser defaults', () => {
  for (const [accept, expected] of [
    ['text/markdown', 'markdown'],
    ['Text/Markdown; charset=utf-8', 'markdown'],
    ['text/html', 'html'],
    ['*/*', 'html'],
    ['text/markdown, */*', 'markdown'],
    ['text/markdown;q=0.4, text/html;q=0.9', 'html'],
    ['text/markdown;q=0.9, text/html;q=0.4', 'markdown'],
    ['text/markdown;q=0, */*;q=1', 'html'],
    ['text/html;q=0, text/*;q=0.5', 'markdown'],
    ['text/markdown;q=0', null],
    ['application/json', null],
    ['text/markdown;q=invalid', null],
  ]) assert.equal(preferredRepresentation(accept), expected, accept);
});

test('Markdown uses the public main content, resolves links, and excludes hidden project details', () => {
  const markdown = htmlToMarkdown(`<!doctype html><body><nav>Sidebar noise</nav><main>
    <h1>Public &amp; useful</h1><p>Read <a href="/work">the work</a>.</p>
    <img src="/photo.webp" alt="A city view"><svg><title>Icon noise</title></svg>
    <div hidden data-gate-reveal>PRIVATE SHOWCASE</div><script>const password='SECRET';</script>
    <div aria-hidden="true">Decorative content</div><form><input value="PRIVATE INPUT"></form>
    <div id="photos-list">Duplicate mobile list</div>
    </main></body>`, 'https://loc.digital/about');
  assert.match(markdown, /# Public & useful/);
  assert.match(markdown, /\[the work\]\(https:\/\/loc.digital\/work\)/);
  assert.match(markdown, /!\[A city view\]\(https:\/\/loc.digital\/photo.webp\)/);
  assert.doesNotMatch(markdown, /Sidebar|PRIVATE|SECRET|Decorative|Duplicate|Icon noise/);
});

test('Markdown responses and recovery preserve status, type, Vary, and cache separation', async () => {
  const handler = createContentHandler({ '/': '# Loc\n\nPublic portfolio content.\n', '/404': '# Not found\n' });
  const home = await handler(new Request('https://loc.digital/', { headers: { Accept: 'text/markdown' } }));
  assert.equal(home.status, 200);
  assert.equal(home.headers.get('Vary'), 'Accept');
  assert.match(home.headers.get('Content-Type'), /^text\/markdown/);
  assert.match(home.headers.get('Cache-Control'), /no-store/);
  assert.match(await home.text(), /Public portfolio/);
  for (const path of ['/missing', '/404', '/%invalid']) {
    const result = await handler(new Request('https://loc.digital' + path, { headers: { Accept: 'text/markdown' } }));
    assert.equal(result.status, 404);
    if (path !== '/404') assert.match(await result.text(), /llms\.txt/);
  }
  const head = await handler(new Request('https://loc.digital/', { method: 'HEAD', headers: { Accept: 'text/markdown' } }));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const rejected = await handler(new Request('https://loc.digital/', { headers: { Accept: 'text/markdown;q=0' } }));
  assert.equal(rejected.status, 406);
});

test('a higher-priority HTML representation stays HTML without a rewrite loop', async () => {
  let calls = 0;
  const handler = createContentHandler({ '/': '# Markdown' }, async (url, init) => {
    calls++;
    assert.equal(url.pathname, '/');
    assert.equal(init.headers.Accept, 'text/html');
    return new Response('<!doctype html><h1>Loc</h1>', { headers: { 'Content-Type': 'text/html' } });
  });
  const result = await handler(new Request('https://loc.digital/', { headers: { Accept: 'text/markdown;q=0.2, text/html;q=1' } }));
  assert.equal(calls, 1);
  assert.match(result.headers.get('Content-Type'), /text\/html/);
  assert.match(await result.text(), /<!doctype html>/);
});
