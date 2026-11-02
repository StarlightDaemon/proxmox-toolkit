const { test } = require('node:test');
const assert = require('node:assert/strict');
const { host, consoleView, terminal, element } = require('./helpers.cjs');
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup(text = 'echo toolkit', options = {}) {
    const view = consoleView();
    const h = host({ views: [view], readClipboard: () => Promise.resolve(text), ...options });
    return { view, h, button: h.action('Paste & Execute') };
}

test('paste uses its owner console and orders paste before a separate Enter', async () => {
    const node = consoleView(), lxc = consoleView({ type: 'lxc', node: 'other', vmid: 202 });
    const h = host({ views: [node, lxc], readClipboard: () => Promise.resolve('printf toolkit') });
    assert.equal(lxc.toolbar.items.items[3], h.created.filter(button => button.text === 'Paste & Execute')[1]);
    await h.paste(1);
    assert.deepEqual(lxc.term.sent, [{ paste: 'printf toolkit' }, { input: '\r' }]);
    assert.deepEqual(node.term.sent, []);
    assert.deepEqual(h.copied, [], 'pasting never writes to the OS clipboard');
    assert.match(h.created.filter(button => button.text === 'Paste & Execute')[1].tooltip, /^Text and Enter sent;/);
});

for (const [name, text, expected] of [
    ['no final newline', 'echo one', 'echo one'],
    ['final LF', 'echo one\n', 'echo one'],
    ['final CRLF and blank lines', 'echo one\r\n\r\n', 'echo one'],
    ['multiline and CRLF', 'echo one\r\necho two\r\n', 'echo one\necho two'],
    ['interior blank lines and CR', 'echo one\r\r echo two\r', 'echo one\n\n echo two'],
    ['spaces and Unicode', '  echo café 界 😀\u00a0  ', '  echo café 界 😀\u00a0  '],
    ['tab with bracketed mode', 'echo\ttoolkit', 'echo\ttoolkit'],
    ['size boundary', 'a'.repeat(65536), 'a'.repeat(65536)],
]) test(`paste text semantics: ${name}`, async () => {
    const { h, view } = setup(text);
    await h.paste();
    assert.deepEqual(view.term.sent, [{ paste: expected }, { input: '\r' }]);
});

for (const [name, text, feedback] of [
    ['empty', '', /no text/], ['non-text', null, /no text/],
    ['blank', '\r\n \t \n', /no command text/],
    ['NUL', 'echo\x00toolkit', /control characters/],
    ['escape injection', '\x1b[201~echo toolkit', /control characters/],
    ['backspace', 'echo\btoolkit', /control characters/],
    ['DEL', 'echo\x7ftoolkit', /control characters/],
    ['C1 CSI', '\x9becho toolkit', /control characters/],
    ['unpaired surrogate', 'echo \ud800', /Unicode/],
    ['oversized', 'a'.repeat(65537), /exceeds/],
]) test(`unsupported clipboard data sends no terminal input: ${name}`, async () => {
    const { h, view, button } = setup(text);
    await h.paste();
    assert.deepEqual(view.term.sent, []);
    assert.match(button.tooltip, feedback);
});

for (const text of ['echo one\necho two', 'echo\ttoolkit']) {
    for (const ignored of [false, true]) test(`multiline/tabs require effective bracketed mode: ${JSON.stringify(text)}, ignored=${ignored}`, async () => {
        const { h, view, button } = setup(text);
        if (ignored) view.term.options.ignoreBracketedPasteMode = true;
        else view.term.modes.bracketedPasteMode = false;
        await h.paste();
        assert.deepEqual(view.term.sent, []);
        assert.match(button.tooltip, /require bracketed paste/);
    });
}

test('single line with final newlines works without bracketed paste', async () => {
    const { h, view } = setup('echo toolkit\r\n\r\n');
    view.term.modes = undefined;
    await h.paste();
    assert.deepEqual(view.term.sent, [{ paste: 'echo toolkit' }, { input: '\r' }]);
});

test('clipboard read starts synchronously with its receiver and user activation intact', async () => {
    let calls = 0;
    const view = consoleView();
    const clipboard = { readText() {
        assert.equal(this, clipboard);
        calls++;
        return Promise.resolve('echo toolkit');
    } };
    const h = host({ views: [view], globals: { navigator: { clipboard, userActivation: { isActive: true } } } });
    const pending = h.paste();
    assert.equal(calls, 1, 'no await before reading');
    h.context.navigator.userActivation.isActive = false;
    await pending;
    assert.equal(view.term.sent.length, 2, 'activation may expire during the browser prompt');
});

for (const [name, change] of [
    ['no activation', h => { h.context.navigator.userActivation.isActive = false; }],
    ['no focus', h => { h.document.focused = false; }],
    ['hidden tab', h => { h.document.hidden = true; }],
    ['no clipboard API', h => { h.context.navigator.clipboard = undefined; }],
    ['no user activation API', h => { h.context.navigator.userActivation = undefined; }],
]) test(`cannot read clipboard without ${name}`, async () => {
    let reads = 0;
    const { h, view } = setup(undefined, { readClipboard() { reads++; return Promise.resolve('echo toolkit'); } });
    change(h);
    await h.paste();
    assert.equal(reads, 0);
    assert.deepEqual(view.term.sent, []);
});

test('unavailable native clipboard reading disables Paste but preserves Copy', async () => {
    const { h, button } = setup(undefined, { globals: { navigator: {} } });
    assert.equal(button.disabled, true);
    assert.equal(h.created[0].disabled, false);
    await h.click();
    assert.deepEqual(h.copied, ['retained output']);
});

for (const [name, change] of [
    ['missing socket', v => { delete v.frame.contentWindow.socket; }],
    ['socket not open', v => { v.frame.contentWindow.socket.readyState = 0; }],
    ['connecting', v => { v.frame.contentWindow.state = 2; }],
    ['no connection state', v => { delete v.frame.contentWindow.states; }],
    ['missing paste', v => { delete v.term.paste; }],
    ['missing input', v => { delete v.term.input; }],
    ['stdin disabled', v => { v.term.options.disableStdin = true; }],
]) test(`disconnected or unsupported input does not read the clipboard: ${name}`, async () => {
    let reads = 0;
    const { h, view, button } = setup(undefined, { readClipboard() { reads++; return Promise.resolve('echo toolkit'); } });
    change(view);
    h.scan();
    assert.equal(button.disabled, true);
    assert.equal(h.created[0].disabled, false, 'retained output remains copyable');
    await h.paste();
    assert.equal(reads, 0);
    assert.deepEqual(view.term.sent, []);
});

for (const [name, change] of [
    ['terminal replacement', (v) => { v.frame.contentWindow.term = terminal('new'); }],
    ['socket replacement', (v) => { v.frame.contentWindow.socket = { readyState: 1 }; }],
    ['disconnection', (v) => { v.frame.contentWindow.socket.readyState = 3; }],
    ['state change', (v) => { v.frame.contentWindow.state = 6; }],
    ['navigation to another node', (v) => {
        v.anchor.nodename = 'other';
        v.frame.contentWindow.location.href = v.frame.contentWindow.location.href.replace('node=pve', 'node=other');
    }],
    ['frame URL change', (v) => { v.frame.contentWindow.location.href += '&different=1'; }],
    ['top page URL change', (_v, h) => { h.context.location.hash = '#other'; }],
    ['ambiguous frames', (v) => { v.frames.push(consoleView().frame); }],
    ['hidden frame', (v) => { v.frame.visible = false; }],
    ['hidden tab', (_v, h) => { h.document.hidden = true; }],
    ['focus moved out of document', (_v, h) => { h.document.focused = false; }],
    ['owner destroyed', (v) => { v.owner.destroyed = true; }],
    ['stdin disabled', (v) => { v.term.options.disableStdin = true; }],
]) test(`clipboard completion cannot send to a changed context: ${name}`, async () => {
    let resolve;
    const { h, view, button } = setup(undefined, { readClipboard: () => new Promise(done => { resolve = done; }) });
    const pending = h.paste();
    change(view, h);
    resolve('echo toolkit');
    await pending;
    assert.deepEqual(view.term.sent, []);
    assert.match(button.tooltip, /cancelled|expired/);
});

for (const event of ['hashchange', 'pagehide', 'visibilitychange']) test(`leaving and returning during a read remains cancelled: ${event}`, async () => {
    let resolve;
    const { h, view } = setup(undefined, { readClipboard: () => new Promise(done => { resolve = done; }) });
    const pending = h.paste();
    if (event === 'visibilitychange') h.document.hidden = true;
    h.events[event]();
    h.document.hidden = false;
    await pending;
    resolve('echo late');
    await flush();
    assert.deepEqual(view.term.sent, []);
});

test('polling latches session invalidation even if it recovers before clipboard completion', async () => {
    let resolve;
    const { h, view } = setup(undefined, { readClipboard: () => new Promise(done => { resolve = done; }) });
    const pending = h.paste();
    view.frame.contentWindow.state = 6;
    h.scan();
    view.frame.contentWindow.state = 3;
    resolve('echo late');
    await pending;
    assert.deepEqual(view.term.sent, []);
});
test('ExtJS hide latches cancellation even when the console returns before the next scan', async () => {
    let resolve;
    const { h, view } = setup(undefined, { readClipboard: () => new Promise(done => { resolve = done; }) });
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    const pending = h.paste();
    assert.equal(h.Ext.GlobalEvents.listeners.size, 1);
    view.frame.visible = false;
    h.Ext.GlobalEvents.fireHide(view.owner);
    view.frame.visible = true;
    await pending;
    resolve('echo late');
    await flush();
    assert.deepEqual(view.term.sent, []);
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
});
for (const shared of [false, true]) test(`unrelated hide events ignore page arguments, shared=${shared}`, async () => {
    let resolve;
    const { h, view } = setup(undefined, { readClipboard: () => new Promise(done => { resolve = done; }),
        globals: shared ? { cloneInto: value => ({ ...value }), exportFunction: callback => callback } : {} });
    h.paste();
    assert.equal(h.Ext.GlobalEvents.listeners.size, 1);
    h.Ext.GlobalEvents.fireHide(new Proxy({}, { get() { throw Error('do not inspect event arguments'); } }));
    resolve('echo toolkit');
    await flush();
    assert.equal(view.term.sent.length, 2);
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
});

for (const [name, invalidate] of [
    ['captured anchor removed', h => { h.anchors.length = 0; }],
    ['component query failure', h => { h.Ext.ComponentQuery.query = () => { throw Error('PRIVATE'); }; }],
    ['frame discovery failure', (_h, view) => { view.root.querySelectorAll = () => { throw Error('PRIVATE'); }; }],
    ['Proxmox unavailable', h => { h.context.unsafeWindow.PVE = undefined; }],
]) test(`polling cancels pending input when discovery fails: ${name}`, async () => {
    let resolve;
    const { h, view, button } = setup(undefined, { readClipboard: () => new Promise(done => { resolve = done; }) });
    const pending = h.paste();
    invalidate(h, view);
    h.scan();
    await pending;
    resolve('echo late');
    await flush();
    assert.deepEqual(view.term.sent, []);
    assert.match(button.tooltip, /cancelled or expired/);
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    assert.equal(JSON.stringify(h.warnings).includes('PRIVATE'), false);
});
for (const outcome of ['denial', 'timeout', 'destroy']) test(`pending hide listener is released after ${outcome}`, async () => {
    let reject;
    const { h, view } = setup(undefined, { readClipboard: () => new Promise((_done, fail) => { reject = fail; }) });
    const pending = h.paste();
    assert.equal(h.Ext.GlobalEvents.listeners.size, 1);
    if (outcome === 'denial') reject(Error('denied'));
    else if (outcome === 'timeout') h.advance(15000);
    else h.created[0].destroy();
    await pending;
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    assert.deepEqual(view.term.sent, []);
});
for (const missing of ['events', 'on', 'un']) test(`missing hide integration (${missing}) disables Paste and preserves Copy`, async () => {
    let reads = 0;
    const { h, view, button } = setup(undefined, { readClipboard() { reads++; return Promise.resolve('echo toolkit'); } });
    if (missing === 'events') h.Ext.GlobalEvents = undefined;
    else h.Ext.GlobalEvents[missing] = undefined;
    h.scan();
    assert.equal(button.disabled, true);
    await h.paste();
    assert.equal(reads, 0);
    assert.deepEqual(view.term.sent, []);
    await h.click();
    assert.deepEqual(h.copied, ['retained output']);
});
for (const stage of ['export', 'subscribe']) test(`failed hide ${stage} sends nothing and releases partial setup`, async () => {
    let reads = 0;
    const { h, view } = setup(undefined, { readClipboard() { reads++; return Promise.resolve('echo toolkit'); } });
    if (stage === 'export') {
        h.context.cloneInto = value => ({ ...value });
        h.context.exportFunction = () => { throw Error('PRIVATE'); };
    } else {
        const events = h.Ext.GlobalEvents;
        events.on = function(name, handler) { this.listeners.add(handler); throw Error('PRIVATE'); };
    }
    await h.paste();
    assert.equal(reads, 0);
    assert.deepEqual(view.term.sent, []);
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    assert.equal(h.created.every(button => !button.disabled), true);
    assert.equal(JSON.stringify(h.warnings).includes('PRIVATE'), false);
});

test('browser prompt may temporarily lose focus, but completion requires focus again', async () => {
    let resolve;
    const { h, view } = setup(undefined, { readClipboard: () => new Promise(done => { resolve = done; }) });
    const pending = h.paste();
    h.document.focused = false;
    h.scan();
    h.document.focused = true;
    resolve('echo toolkit');
    await pending;
    assert.equal(view.term.sent.length, 2);
});

test('late clipboard completion after timeout sends nothing, including after a fresh operation', async () => {
    let resolve, reads = 0;
    const { h, view, button } = setup(undefined, { readClipboard: () => ++reads === 1
        ? new Promise(done => { resolve = done; }) : Promise.resolve('echo new') });
    const pending = h.paste();
    h.advance(15000);
    await pending;
    assert.match(button.tooltip, /cancelled or expired/);
    assert.deepEqual(view.term.sent, []);
    await h.paste();
    resolve('echo old');
    await flush();
    assert.deepEqual(view.term.sent, [{ paste: 'echo new' }, { input: '\r' }]);
});

for (const synchronous of [true, false]) test(`clipboard denial is contained without retry or secret leakage, sync=${synchronous}`, async () => {
    let reads = 0;
    const { h, view, button } = setup(undefined, { readClipboard() {
        reads++;
        if (synchronous) throw Error('SECRET CLIPBOARD');
        return Promise.reject(Error('SECRET CLIPBOARD'));
    } });
    await h.paste();
    assert.equal(reads, 1);
    assert.deepEqual(view.term.sent, []);
    assert.match(button.tooltip, /read failed or permission denied/);
    assert.equal(JSON.stringify(h.warnings).includes('SECRET'), false);
});

test('late clipboard rejection after cancellation is handled', async () => {
    let reject;
    const { h, view } = setup(undefined, { readClipboard: () => new Promise((_done, fail) => { reject = fail; }) });
    const pending = h.paste();
    h.events.hashchange();
    await pending;
    reject(Error('late denied'));
    await flush();
    assert.deepEqual(view.term.sent, []);
});

test('one pending clipboard operation blocks repeated paste and copy across all controls', async () => {
    let resolve, reads = 0;
    const views = [consoleView(), consoleView({ node: 'other' })];
    const h = host({ views, readClipboard() { reads++; return new Promise(done => { resolve = done; }); } });
    const pending = h.paste();
    assert.equal(h.action('Paste & Execute').disabled, false, 'initiator keeps focus');
    for (const text of ['Copy', 'Paste Only']) {
        for (const button of h.created.filter(button => button.text === text)) assert.equal(button.disabled, true);
    }
    assert.equal(h.action('Diagnostics').disabled, false, 'opening a panel does not need the lease');
    await h.paste();
    await h.paste(1);
    await h.click();
    assert.equal(reads, 1);
    assert.deepEqual(h.copied, []);
    resolve('echo toolkit');
    await pending;
    assert.equal(h.created.every(button => !button.disabled), true);
});

test('pending Copy blocks Paste without reading the clipboard', async () => {
    let resolve, reads = 0;
    const { h, view } = setup(undefined, { clipboard: () => new Promise(done => { resolve = done; }),
        readClipboard() { reads++; return Promise.resolve('echo toolkit'); } });
    const pending = h.click();
    await h.paste();
    assert.equal(reads, 0);
    resolve();
    await pending;
    assert.deepEqual(view.term.sent, []);
});

for (const stage of ['paste', 'input']) test(`partial ${stage} failure is uncertain and never retried`, async () => {
    const { h, view, button } = setup();
    let calls = 0;
    view.term[stage] = () => { calls++; throw Error('SECRET'); };
    await h.paste();
    assert.equal(calls, 1);
    assert.match(button.tooltip, /partially sent; inspect console/);
    assert.equal(view.term.sent.some(entry => entry.input), false);
    assert.equal(JSON.stringify(h.warnings).includes('SECRET'), false);
});

test('connection changing during paste prevents Enter on the replacement session', async () => {
    const { h, view, button } = setup();
    view.term.paste = text => {
        view.term.sent.push({ paste: text });
        view.frame.contentWindow.socket = { readyState: 1 };
    };
    await h.paste();
    assert.deepEqual(view.term.sent, [{ paste: 'echo toolkit' }]);
    assert.match(button.tooltip, /Enter not sent/);
});

test('destroying either action tears down the pair and cancels pending reads', async () => {
    for (const index of [0, 1]) {
        let resolve;
        const { h, view } = setup(undefined, { readClipboard: () => new Promise(done => { resolve = done; }) });
        const pending = h.paste();
        h.created[index].destroy();
        assert.equal(h.created.slice(0, 2).every(button => button.destroyed), true);
        resolve('echo late');
        await pending;
        assert.deepEqual(view.term.sent, []);
        assert.equal(view.toolbar.items.items.filter(item => item.pveToolkitPasteButton).length, 1, 'one new pair is discovered');
    }
});

test('paste insertion failure leaves no partial toolbar controls', () => {
    const view = consoleView();
    const insert = view.toolbar.insert;
    view.toolbar.insert = function(index, button) {
        if (button.text === 'Paste & Execute') throw Error('layout failure');
        insert.call(this, index, button);
    };
    const h = host({ views: [view] });
    assert.equal(h.created.every(button => button.destroyed), true);
    assert.deepEqual(view.toolbar.items.items, [view.anchor]);
    assert.equal(h.api.controls.size, 0);
});

test('paste feedback restores its own icon and conservatively returns terminal focus', async () => {
    const { h, view, button } = setup();
    h.document.activeElement = button.el;
    await h.paste();
    assert.equal(view.term.focused, 1);
    h.advance(1500);
    assert.equal(button.text, 'Paste & Execute');
    assert.equal(button.iconCls, 'fa fa-play');
    assert.match(button.tooltip, /^Paste clipboard text/);
    h.document.activeElement = element();
    await h.paste();
    assert.equal(view.term.focused, 1);
});

test('idle scans never read the clipboard', () => {
    let reads = 0;
    const { h } = setup(undefined, { readClipboard() { reads++; throw Error('idle read'); } });
    for (let i = 0; i < 10; i++) h.scan();
    assert.equal(reads, 0);
});

test('Firefox wrapped frame globals provide a connected paste session', async () => {
    const { h, view } = setup();
    const globals = view.frame.contentWindow;
    view.frame.contentWindow = { location: globals.location, wrappedJSObject: globals };
    await h.paste();
    assert.equal(view.term.sent.length, 2);
});

test('Firefox exported paste callback ignores page arguments and returns no promise', async () => {
    const { h, view } = setup(undefined, { globals: {
        cloneInto: value => ({ ...value }), exportFunction: callback => callback,
    } });
    const untrusted = new Proxy({}, { get() { throw Error('page arguments must not be read'); } });
    assert.equal(h.action('Paste & Execute').handler(untrusted), undefined);
    await flush();
    assert.equal(view.term.sent.length, 2);
});
