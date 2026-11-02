const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { verify, destination } = require('../tools/fetch-xterm.cjs');
const { host, consoleView } = require('./helpers.cjs');

// No skipping: run tools/fetch-xterm.cjs first. Integrity is checked before code
// execution, including when a fixture was populated through another download path.
verify(fs.readFileSync(destination));
const { Terminal } = require(destination);
const write = (term, text) => new Promise(resolve => term.write(text, resolve));
async function fixture(options, fn) {
    // Do not enable proposed APIs or open a DOM renderer: use Proxmox's default
    // public buffer API and real parser. This is not browser/manager acceptance.
    const term = new Terminal({ cols: 8, rows: 4, scrollback: 100, ...options });
    try { await fn(term); } finally { term.dispose(); }
}
const extract = term => host().api.extractFullConsole(term);

for (const text of ['abcd界', 'abc 界', 'ab界cd界', 'abcd\u00a0', 'Cafe\u0301', 'A\u2003', '中 文', 'abcd😀', '👩‍💻']) {
    test(`real xterm preserves ${JSON.stringify(text)} across wrapping/padding`, async () => {
        await fixture({ cols: 5 }, async term => {
            await write(term, text);
            assert.equal(extract(term).text, text);
        });
    });
}
test('real xterm wide-wrap correction does not delete literal spaces', async () => {
    await fixture({ cols: 5 }, async term => {
        await write(term, 'abc  界');
        assert.equal(extract(term).text, 'abc  界');
    });
});
test('real xterm retains normal scrollback and interior blank rows', async () => {
    await fixture({}, async term => {
        const text = 'first\r\n\r\n' + Array.from({ length: 20 }, (_, i) => `row ${i}`).join('\r\n');
        await write(term, text);
        assert.equal(extract(term).text, text.replace(/\r\n/g, '\n'));
        assert.ok(term.buffer.normal.length > term.rows);
    });
});
test('real xterm alternate-screen entry/exit preserves correct buffer choice', async () => {
    await fixture({}, async term => {
        await write(term, 'shell\x1b[?1049h\x1b[Halternate');
        assert.equal(extract(term).text, 'alternate');
        assert.equal(extract(term).alternateScreen, true);
        await write(term, '\x1b[?1049l');
        assert.equal(extract(term).text, 'shell');
        assert.equal(extract(term).alternateScreen, false);
    });
});
test('real xterm reflow of completed wrapped lines preserves text after resize', async () => {
    await fixture({ cols: 12 }, async term => {
        const text = 'long output with spaces and 界';
        await write(term, text + '\r\nnext');
        term.resize(7, 4);
        assert.equal(extract(term).text, text + '\nnext');
        term.resize(16, 4);
        assert.equal(extract(term).text, text + '\nnext');
    });
});
test('real xterm strips terminal escape styling without evaluating displayed text', async () => {
    await fixture({}, async term => {
        await write(term, '\x1b[31m<script>\x1b[0m');
        assert.equal(extract(term).text, '<script>');
    });
});
for (const edition of ['toolkit', 'copy']) test(`${edition} installed copy handler works with the real xterm buffer`, async () => {
    await fixture({ cols: 5 }, async term => {
        await write(term, 'abcd界\r\nnext');
        const view = consoleView();
        view.frame.contentWindow.term = term;
        const h = host({ views: [view], edition });
        await h.click();
        assert.deepEqual(h.copied, ['abcd界\nnext']);
    });
});

test('renderer-free xterm emits bracketed paste data before its missing-textarea error; Enter is separate', async () => {
    await fixture({}, async term => {
        await write(term, '\x1b[?2004h');
        const sent = [];
        term.onData(data => sent.push(data));
        assert.equal(term.modes.bracketedPasteMode, true);
        // paste() emits onData before clearing the textarea. This fixture has no
        // renderer/textarea, so assert that specific limitation rather than
        // patching private internals or claiming browser paste acceptance.
        assert.throws(() => term.paste('echo one\necho two'), /Cannot set properties of undefined/);
        term.input('\r');
        assert.deepEqual(sent, ['\x1b[200~echo one\recho two\x1b[201~', '\r']);
    });
});

for (const edition of ['toolkit', 'paste']) test(`${edition} real-xterm partial paste failure is not followed by Enter or retry`, async () => {
    await fixture({}, async term => {
        await write(term, '\x1b[?2004h');
        const sent = [];
        term.onData(data => sent.push(data));
        const view = consoleView();
        view.frame.contentWindow.term = term;
        const h = host({ views: [view], edition, readClipboard: () => Promise.resolve('echo toolkit\n') });
        await h.paste();
        assert.deepEqual(sent, ['\x1b[200~echo toolkit\x1b[201~']);
        assert.match(h.created.find(button => button.text === 'Paste & Execute').tooltip, /partially sent; inspect console/);
    });
});
