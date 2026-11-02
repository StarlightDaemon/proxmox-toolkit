const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { host, consoleView, terminal } = require('./helpers.cjs');
const { manifest, buildEdition } = require('../tools/build.cjs');
const flush = () => new Promise(resolve => setImmediate(resolve));

test('all editions are deterministic generated files at one Toolkit version', () => {
    for (const edition of manifest.editions) {
        const text = fs.readFileSync(edition.file, 'utf8').replace(/\r\n/g, '\n');
        assert.equal(text, buildEdition(edition));
        assert.equal(text.match(/^\/\/ @version\s+(\S+)$/m)[1], manifest.version);
    }
});
test('standalone capability boundaries exclude unused APIs and grants', () => {
    const copy = buildEdition(manifest.editions.find(edition => edition.id === 'copy'));
    const paste = buildEdition(manifest.editions.find(edition => edition.id === 'paste'));
    assert.doesNotMatch(copy, /navigator|readText|pasteAndExecute|\.paste\(|\.input\(/);
    assert.doesNotMatch(paste, /GM_setClipboard|GM\.setClipboard|GM_info|GM\.info|extractBuffer|copyConsole|writeClipboard/);
    assert.deepEqual([...paste.matchAll(/^\/\/ @grant\s+(\S+)$/gm)].map(match => match[1]), ['unsafeWindow']);
});
test('one manifest version change stamps every edition without changing runtime bodies', () => {
    const version = manifest.version;
    const before = manifest.editions.map(edition => buildEdition(edition));
    try {
        for (const next of ['99.0.0-test', '99.0.0']) {
            manifest.version = next;
            for (const [index, edition] of manifest.editions.entries()) {
                const text = buildEdition(edition);
                assert.equal(text.match(/^\/\/ @version\s+(\S+)$/m)[1], next);
                assert.equal(text.includes('// @description  Development candidate:'), next.includes('-'));
                assert.equal(text.slice(text.indexOf('(() => {')), before[index].slice(before[index].indexOf('(() => {')));
            }
        }
    } finally { manifest.version = version; }
});
test('Copy-only works without clipboard reading, terminal input, or hide integration', async () => {
    const view = consoleView();
    delete view.term.paste;
    delete view.term.input;
    const h = host({ views: [view], edition: 'copy', globals: { navigator: undefined } });
    h.Ext.GlobalEvents = undefined;
    assert.deepEqual(h.created.map(button => button.text), ['Copy']);
    await h.click();
    assert.deepEqual(h.copied, ['retained output']);
    assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'), false);
});
test('Paste-only works without clipboard-write APIs or buffer extraction', async () => {
    const view = consoleView();
    view.term.buffer.normal.getLine = () => { throw Error('must not extract'); };
    const h = host({ views: [view], edition: 'paste', globals: { GM_setClipboard: undefined, GM_info: undefined } });
    assert.deepEqual(h.created.map(button => button.text), ['Paste & Execute']);
    await h.paste();
    assert.equal(view.term.sent.length, 2);
    assert.deepEqual(h.copied, []);
});
for (const order of [['copy', 'paste'], ['paste', 'copy']]) test(`individual editions coexist in toolbar order: ${order}`, async () => {
    const view = consoleView();
    const h = host({ views: [view], edition: order[0] });
    h.installEdition(order[1]);
    for (let i = 0; i < 5; i++) h.scan();
    assert.deepEqual(view.toolbar.items.items.slice(1).map(button => button.text), ['Copy', 'Paste & Execute']);
    await h.click();
    await h.paste();
    assert.deepEqual(h.copied, ['retained output']);
    assert.equal(view.term.sent.length, 2);
});
for (const order of [['toolkit', 'copy', 'paste'], ['copy', 'paste', 'toolkit'], ['paste', 'toolkit', 'copy']]) {
    test(`overlapping editions never install duplicate actions: ${order}`, () => {
        const view = consoleView();
        const h = host({ views: [view], edition: order[0] });
        for (const edition of order.slice(1)) h.installEdition(edition);
        for (let i = 0; i < 10; i++) h.scan();
        const texts = view.toolbar.items.items.slice(1).map(button => button.text);
        assert.equal(texts.filter(text => text === 'Copy').length, 1);
        assert.equal(texts.filter(text => text === 'Paste & Execute').length, 1);
    });
}
for (const edition of ['copy', 'paste']) test(`${edition} duplicate installation and teardown recover without leaks`, () => {
    const h = host({ views: [consoleView()], edition });
    h.installEdition(edition);
    assert.equal(h.created.length, 1);
    h.created[0].destroy();
    h.scan();
    assert.equal(h.created.length, 2);
    assert.equal(h.created[0].destroyCalls, 1);
    assert.equal(h.timers.size, 0);
});
for (const edition of ['toolkit', 'paste']) {
    for (const [name, invalidate] of [
        ['terminal', view => { view.frame.contentWindow.term = terminal(); }],
        ['socket', view => { view.frame.contentWindow.socket = { readyState: 1 }; }],
        ['hide/show', (view, h) => { view.frame.visible = false; h.Ext.GlobalEvents.fireHide(view.owner); view.frame.visible = true; }],
        ['page hide', (_view, h) => h.events.pagehide()],
        ['missing discovery', (_view, h) => { h.anchors.length = 0; h.scan(); }],
        ['timeout', (_view, h) => h.advance(15000)],
    ]) test(`${edition} cancels stale intent after ${name}`, async () => {
        let resolve;
        const view = consoleView();
        const h = host({ views: [view], edition, readClipboard: () => new Promise(done => { resolve = done; }) });
        const pending = h.paste();
        invalidate(view, h);
        resolve('echo late');
        await pending;
        assert.deepEqual(view.term.sent, []);
        assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
        assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'), false);
    });
}
for (const busyAction of ['copy', 'paste']) test(`shared lease blocks the other edition while ${busyAction} is pending`, async () => {
    let resolve, reads = 0, writes = 0;
    const view = consoleView();
    const h = host({ views: [view], edition: 'copy',
        clipboard() { writes++; return busyAction === 'copy' ? new Promise(done => { resolve = done; }) : undefined; },
        readClipboard() { reads++; return busyAction === 'paste' ? new Promise(done => { resolve = done; }) : Promise.resolve('echo toolkit'); },
    });
    h.installEdition('paste');
    const pending = busyAction === 'copy' ? h.click() : h.paste();
    await (busyAction === 'copy' ? h.paste() : h.click());
    assert.deepEqual({ reads, writes }, busyAction === 'copy' ? { reads: 0, writes: 1 } : { reads: 1, writes: 0 });
    resolve('echo toolkit');
    await pending;
    h.scan();
    assert.equal(h.created.every(button => button.disabled === false), true);
    await (busyAction === 'copy' ? h.paste() : h.click());
    assert.deepEqual({ reads, writes }, { reads: 1, writes: 1 });
});
test('an edition cannot release another clipboard lease', async () => {
    let resolve;
    const view = consoleView();
    const h = host({ views: [view], edition: 'paste', readClipboard: () => new Promise(done => { resolve = done; }) });
    const pending = h.paste();
    h.document.documentElement.setAttribute('data-proxmox-toolkit-clipboard', 'replacement-owner');
    resolve('echo toolkit');
    await pending;
    assert.equal(h.document.documentElement.getAttribute('data-proxmox-toolkit-clipboard'), 'replacement-owner');
    assert.deepEqual(view.term.sent, []);
    assert.match(h.created[0].tooltip, /cancelled|expired/);
});
test('Paste-only denial, partial failure, and late rejection release resources without retry', async () => {
    for (const stage of ['denial', 'paste', 'input', 'late']) {
        let reject, calls = 0;
        const view = consoleView();
        if (stage === 'paste' || stage === 'input') view.term[stage] = () => { calls++; throw Error('PRIVATE'); };
        const h = host({ views: [view], edition: 'paste', readClipboard: () => {
            if (stage === 'denial') return Promise.reject(Error('PRIVATE'));
            if (stage === 'late') return new Promise((_resolve, fail) => { reject = fail; });
            return Promise.resolve('echo toolkit');
        } });
        const pending = h.paste();
        if (stage === 'late') h.events.hashchange();
        await pending;
        if (stage === 'late') { reject(Error('PRIVATE')); await flush(); }
        assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
        assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'), false);
        assert.equal(calls, stage === 'paste' || stage === 'input' ? 1 : 0);
        assert.doesNotMatch(JSON.stringify(h.warnings), /PRIVATE/);
    }
});
test('individual editions add one bounded scan each and no hidden discovery', () => {
    const h = host({ views: [consoleView(), consoleView({ node: 'other' })], edition: 'copy' });
    h.installEdition('paste');
    const queries = h.Ext.queries;
    let markerReads = 0;
    const hasAttribute = h.document.documentElement.hasAttribute;
    h.document.documentElement.hasAttribute = name => { markerReads++; return hasAttribute(name); };
    for (let i = 0; i < 100; i++) h.scan();
    assert.equal(h.Ext.queries - queries, 200);
    assert.equal(markerReads, 200, 'one shared-busy read per edition scan');
    assert.equal(h.intervals.length, 2);
    const beforeHidden = h.Ext.queries;
    h.document.hidden = true;
    for (let i = 0; i < 100; i++) h.scan();
    assert.equal(h.Ext.queries, beforeHidden);
    assert.equal(markerReads, 200, 'hidden ticks do not read shared-busy state');
    assert.equal(h.timers.size, 0);
});
for (const action of ['copy', 'paste']) test(`destroying pending ${action} standalone preserves the other edition and releases its lease`, async () => {
    let resolve;
    const view = consoleView();
    const h = host({ views: [view], edition: 'copy',
        clipboard: () => action === 'copy' ? new Promise(done => { resolve = done; }) : undefined,
        readClipboard: () => action === 'paste' ? new Promise(done => { resolve = done; }) : Promise.resolve('echo toolkit'),
    });
    h.installEdition('paste');
    const pending = action === 'copy' ? h.click() : h.paste();
    const target = h.created.find(button => button.text === (action === 'copy' ? 'Copy' : 'Paste & Execute'));
    const other = h.created.find(button => button !== target);
    target.destroy();
    resolve('echo late');
    await pending;
    h.scan();
    assert.equal(other.destroyed, undefined);
    assert.equal(other.disabled, false);
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'), false);
    if (action === 'paste') assert.deepEqual(view.term.sent, []);
});
for (const [text, bracketed, sends] of [
    ['  echo café 界 😀  \r\n', false, true],
    ['echo one\r\necho two\r\n', true, true],
    ['echo one\necho two', false, false],
    ['echo\ttoolkit', false, false],
    ['echo\x1b[201~toolkit', true, false],
    ['echo \ud800', true, false],
    ['a'.repeat(65537), true, false],
    [' \r\n\t ', true, false],
]) test(`Paste-only text safeguard: ${text.length} units, bracketed=${bracketed}, sends=${sends}`, async () => {
    const view = consoleView();
    view.term.modes.bracketedPasteMode = bracketed;
    const h = host({ views: [view], edition: 'paste', readClipboard: () => Promise.resolve(text) });
    await h.paste();
    assert.equal(view.term.sent.length, sends ? 2 : 0);
    if (sends) assert.deepEqual(view.term.sent, [{ paste: text.replace(/\r\n?/g, '\n').replace(/\n+$/u, '') }, { input: '\r' }]);
});
