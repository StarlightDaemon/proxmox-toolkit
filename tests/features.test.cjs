const { test } = require('node:test');
const assert = require('node:assert/strict');
const { host, consoleView, terminal, row, buffer } = require('./helpers.cjs');

for (const [text, bracketed, expected] of [
    ['  café 界 😀  \r\n\n', false, '  café 界 😀  '],
    ['one\r\ntwo\r', true, 'one\ntwo'], ['a\tb', true, 'a\tb'],
    ['a\nb', false, null], ['a\tb', false, null], [' \n', true, null],
    ['\x1b[201~', true, null], ['\ud800', true, null], ['a'.repeat(65537), true, null],
    ['a'.repeat(65536), false, 'a'.repeat(65536)],
]) test(`Paste Only validation: ${text.length} units, bracketed=${bracketed}, accepted=${expected !== null}`, async () => {
    const view = consoleView();
    delete view.term.input;
    view.term.modes.bracketedPasteMode = bracketed;
    let reads = 0;
    const h = host({ views: [view], enabledFeatures: ['PASTE_ONLY'], readClipboard: () => { reads++; return Promise.resolve(text); } });
    assert.equal(h.created[0].disabled, false);
    await h.created[0].handler();
    assert.equal(reads, 1);
    assert.deepEqual(view.term.sent, expected === null ? [] : [{ paste: expected }]);
    if (expected !== null) assert.match(h.created[0].tooltip, /Text sent; no Enter appended/);
});

for (const [name, invalidate] of [
    ['navigation', (_, h) => h.events.hashchange()],
    ['hidden', (_, h) => { h.document.hidden = true; h.events.visibilitychange(); h.document.hidden = false; }],
    ['hide/show', (v, h) => { v.frame.visible = false; h.Ext.GlobalEvents.fireHide(); v.frame.visible = true; }],
    ['replacement', v => { v.frame.contentWindow.term = terminal(); }],
    ['socket', v => { v.frame.contentWindow.socket = { readyState: 1 }; }],
    ['lease', (_, h) => h.document.documentElement.setAttribute('data-proxmox-toolkit-clipboard', 'other')],
    ['expiry', (_, h) => h.advance(15000)],
    ['destroy', (_, h) => h.created[0].destroy()],
]) test(`Paste Only cancels ${name}`, async () => {
    const view = consoleView();
    let resolve;
    const h = host({ views: [view], enabledFeatures: ['PASTE_ONLY'], readClipboard: () => new Promise(done => { resolve = done; }) });
    const pending = h.created[0].handler();
    invalidate(view, h);
    resolve('never send');
    await pending;
    assert.deepEqual(view.term.sent, []);
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    if (name === 'lease') assert.equal(h.document.documentElement.getAttribute('data-proxmox-toolkit-clipboard'), 'other');
});

test('Paste Only denial and partial send never retry', async () => {
    for (const denial of [true, false]) {
        const view = consoleView();
        let pastes = 0;
        view.term.paste = () => { pastes++; throw Error('PRIVATE'); };
        const h = host({ views: [view], enabledFeatures: ['PASTE_ONLY'], readClipboard: () => denial ? Promise.reject(Error('PRIVATE')) : Promise.resolve('test') });
        await h.created[0].handler();
        assert.equal(pastes, denial ? 0 : 1);
        assert.match(h.created[0].tooltip, denial ? /permission denied/ : /partially sent/);
        assert.deepEqual(view.term.sent, []);
        assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    }
});

for (const edition of ['toolkit', 'export']) test(`${edition} export uses Copy extraction exactly and snapshots once`, async () => {
    const view = consoleView();
    view.term.buffer.normal = buffer([row('abcd'), row('界 😀', true), row(''), row('<script>```</script>   ')]);
    view.term.buffer.active = view.term.buffer.normal;
    view.frame.contentWindow.socket.readyState = 3;
    let reads = 0;
    const h = host({ views: [view], enabledFeatures: edition === 'export' ? ['EXPORT'] : undefined, readClipboard: () => { reads++; throw Error('no reads'); } });
    const expected = h.api.extractFullConsole(view.term).text;
    h.action('Export Console').handler();
    assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'), false);
    view.term.buffer.normal.getLine = () => { throw Error('no second extraction'); };
    h.action('Download plain text').handler();
    const plain = h.downloads[0];
    assert.equal(await plain.blob.text(), expected);
    assert.deepEqual(Buffer.from(await plain.blob.arrayBuffer()), Buffer.from(expected, 'utf8'));
    assert.equal(plain.filename, 'proxmox-console-20261102T183000Z.txt');
    assert.equal(plain.blob.type, 'text/plain;charset=utf-8');
    assert.equal(h.action('Download plain text').tooltip, 'Download requested');
    h.action('Download Markdown').handler();
    assert.equal(await h.downloads[1].blob.text(), '````\n' + expected + '\n````\n');
    assert.equal(h.downloads[1].filename, 'proxmox-console-20261102T183000Z.md');
    assert.equal(h.domAnchors.every(anchor => !anchor.isConnected), true);
    assert.equal(h.blobs.size, 2);
    h.advance(1000);
    assert.equal(h.blobs.size, 0);
    assert.equal(h.revoked.length, 2);
    assert.equal(reads, 0);
    assert.deepEqual(h.copied, []);
    assert.deepEqual(view.term.sent, []);
});

for (const [name, change, message] of [
    ['empty', v => { v.term.buffer.normal = buffer([]); }, /empty/],
    ['unavailable', v => { v.term.buffer.normal = {}; }, /buffer unavailable/],
    ['ambiguous', v => v.frames.push(consoleView().frame), /ambiguous/],
]) test(`export refuses ${name} without download`, () => {
    const view = consoleView();
    const h = host({ views: [view], enabledFeatures: ['EXPORT'] });
    change(view);
    h.action('Export Console').handler();
    assert.match(h.action('Export Console').tooltip, message);
    assert.deepEqual(h.downloads, []);
    assert.equal(h.blobs.size, 0);
});

test('export alternate screen and literal long fences are preserved', async () => {
    const v = consoleView();
    v.term.buffer.alternate = buffer([row('`````<b>界</b>'), row('~~~')]);
    v.term.buffer.active = v.term.buffer.alternate;
    const h = host({ views: [v], enabledFeatures: ['EXPORT'] });
    h.action('Export Console').handler();
    h.action('Download Markdown').handler();
    assert.equal(await h.downloads[0].blob.text(), '``````\n`````<b>界</b>\n~~~\n``````\n');
    h.events.pagehide();
    assert.equal(h.blobs.size, 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.components.filter(c => c.type === 'Ext.window.Window').every(c => c.destroyed), true);
});

for (const stage of ['blob', 'create', 'append', 'click']) test(`download failure at ${stage} cleans resources`, () => {
    const h = host({ views: [consoleView()], enabledFeatures: ['EXPORT'] });
    h.action('Export Console').handler();
    const fail = () => { throw Error('PRIVATE'); };
    if (stage === 'blob') h.context.URL.createObjectURL = fail;
    if (stage === 'create') h.document.createElement = fail;
    if (stage === 'append') h.document.body.appendChild = fail;
    if (stage === 'click') {
        const create = h.document.createElement;
        h.document.createElement = tag => ({ ...create(tag), click: fail });
    }
    h.action('Download plain text').handler();
    assert.equal(h.blobs.size, 0);
    assert.match(h.action('Download plain text').tooltip, /failed/);
    assert.doesNotMatch(JSON.stringify(h.warnings), /PRIVATE/);
});

const diagnosticState = h => [...h.api.controls.values()][0].actions.find(action => action.text === 'Diagnostics');
for (const [code, change] of [
    ['DOCUMENT_HIDDEN', (_, h) => { h.document.hidden = true; }],
    ['CONTEXT_INELIGIBLE', v => { v.anchor.consoleType = 'kvm'; }],
    ['OWNER_UNAVAILABLE', v => { v.toolbar.items.items = []; }],
    ['ANCHOR_AMBIGUOUS', (v, h) => { const a = consoleView().anchor; a.up = () => v.toolbar; v.toolbar.items.items.push(a); h.anchors.push(a); }],
    ['CONSOLE_MISSING', v => { v.frames.length = 0; }],
    ['CONSOLE_AMBIGUOUS', v => v.frames.push(consoleView().frame)],
    ['FRAME_INACCESSIBLE', v => Object.defineProperty(v.frame, 'contentWindow', { get() { throw Error('PRIVATE'); } })],
    ['TERMINAL_API_UNAVAILABLE', v => { v.frame.contentWindow.term = null; }],
    ['BUFFER_UNAVAILABLE', v => { v.term.buffer.normal = {}; }],
    ['PASTE_API_UNAVAILABLE', v => { delete v.term.paste; }],
    ['ENTER_API_UNAVAILABLE', v => { delete v.term.input; }],
    ['SESSION_DISCONNECTED', v => { v.frame.contentWindow.socket.readyState = 3; }],
    ['SESSION_UNKNOWN', v => { delete v.frame.contentWindow.states; }],
    ['STDIN_DISABLED', v => { v.term.options.disableStdin = true; }],
    ['CLIPBOARD_READ_UNAVAILABLE', (_, h) => { delete h.context.navigator.clipboard.readText; }],
    ['CLIPBOARD_WRITE_UNAVAILABLE', (_, h) => { h.context.GM_setClipboard = undefined; }],
    ['ACTIVATION_API_UNAVAILABLE', (_, h) => { delete h.context.navigator.userActivation; }],
    ['HIDE_LIFECYCLE_UNAVAILABLE', (_, h) => { h.Ext.GlobalEvents = null; }],
    ['CLIPBOARD_BUSY', (_, h) => h.document.documentElement.setAttribute('data-proxmox-toolkit-clipboard', 'other')],
    ['INSPECTION_FAILED', (_, h) => { h.Ext.ComponentQuery.query = () => { throw Error('PRIVATE'); }; }],
]) test(`diagnostic reason ${code}`, () => {
    const v = consoleView();
    const h = host({ views: [v], enabledFeatures: ['DIAGNOSTICS'] });
    const state = diagnosticState(h);
    change(v, h);
    const report = h.api.diagnosticReport(state);
    assert.ok(report.reasons.includes(code), JSON.stringify(report));
    assert.doesNotMatch(JSON.stringify(report), /PRIVATE/);
});

test('diagnostic report is allowlisted, explicit, private and does not inspect rows or permissions', async () => {
    const v = consoleView({ node: 'SECRET-HOST', vmid: 987654, text: 'SECRET-OUTPUT' });
    v.frame.contentWindow.location.href += '&ticket=SECRET-TICKET';
    v.term.buffer.normal.getLine = () => { throw Error('row access'); };
    v.term.secret = new Proxy({}, { get() { throw Error('arbitrary traversal'); } });
    const h = host({ views: [v], enabledFeatures: ['DIAGNOSTICS'], manager: 'SECRET-MANAGER',
        readClipboard: () => { throw Error('clipboard read'); } });
    assert.equal(h.copied.length, 0);
    const report = h.api.diagnosticReport(diagnosticState(h));
    assert.deepEqual(Object.keys(report).sort(), ['schema','version','edition','manager','context','eligible','counts','capabilities','buffer','connected','stdinEnabled','bracketedPaste','clipboardBusy','reasons'].sort());
    assert.equal(report.manager, null);
    assert.equal(report.capabilities.clipboardRead, true);
    assert.equal(report.connected, true);
    h.action('Diagnostics').handler();
    const body = h.components.find(c => c.type === 'Ext.form.field.TextArea');
    assert.match(body.value, /API presence is not permission approval/);
    assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'), false);
    v.frame.contentWindow.socket.readyState = 3;
    for (let i = 0; i < 20; i++) h.scan();
    await h.action('Copy diagnostic report').handler();
    assert.equal(JSON.parse(h.copied[0]).connected, true, 'copy preserves the displayed snapshot');
    h.action('Refresh').handler();
    await h.action('Copy diagnostic report').handler();
    assert.equal(JSON.parse(h.copied[1]).connected, false);
    assert.doesNotMatch(h.copied.join(''), /SECRET|987654|https:|socket|ticket|permissionGranted/);
    assert.deepEqual(v.term.sent, []);
});

test('Diagnostics installs with missing console; bracketed paste is conditional and unknowns remain null', () => {
    const v = consoleView();
    v.frames.length = 0;
    const h = host({ views: [v], enabledFeatures: ['DIAGNOSTICS'] });
    assert.equal(h.action('Diagnostics').disabled, false);
    h.action('Diagnostics').handler();
    let report = h.api.diagnosticReport(diagnosticState(h));
    assert.equal(report.connected, null);
    assert.equal(report.buffer, null);
    v.frames.push(v.frame);
    v.term.modes.bracketedPasteMode = false;
    report = h.api.diagnosticReport(diagnosticState(h));
    assert.equal(report.bracketedPaste, false);
    assert.deepEqual([...report.reasons], []);
    h.document.hidden = true;
    report = h.api.diagnosticReport(diagnosticState(h));
    assert.deepEqual(Object.values(report.counts), [null, null, null], 'unobserved counts are unknown, not zero');
});

test('diagnostics rejects nonprimitive native identity without coercing arbitrary objects', () => {
    const v = consoleView();
    const h = host({ views: [v], enabledFeatures: ['DIAGNOSTICS'] });
    v.anchor.nodename = new Proxy({}, { get() { throw Error('must not coerce'); } });
    const report = h.api.diagnosticReport(diagnosticState(h));
    assert.equal(report.eligible, false);
    assert.deepEqual([...report.reasons], ['CONTEXT_INELIGIBLE']);
});

const commands = ['pveversion -v', 'df -h', 'uname -a', 'systemctl --failed --no-pager'];
test('recipe catalogue copies exact commands without extraction, read, input, newline, or lease while browsing', async () => {
    const v = consoleView();
    v.term.buffer.normal.getLine = () => { throw Error('extract'); };
    const h = host({ views: [v], enabledFeatures: ['RECIPES'], readClipboard: () => { throw Error('read'); } });
    h.action('Recipes').handler();
    for (const command of commands) {
        assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'), false);
        assert.ok(h.components.find(c => c.type === 'Ext.form.field.TextArea').value.includes(command));
        await h.action('Copy command').handler();
        h.action('Next').handler();
    }
    assert.deepEqual(h.copied, commands);
    assert.deepEqual(v.term.sent, []);
    h.action('Previous').handler();
    assert.match(h.components.find(c => c.type === 'Ext.form.field.TextArea').value, /systemd 233/);
});

for (const [name, change] of [
    ['LXC node-only entry', v => { v.anchor.consoleType = 'lxc'; v.frame.contentWindow.location.href = v.frame.contentWindow.location.href.replace('console=shell', 'console=lxc'); }],
    ['replacement', v => { v.frame.contentWindow.term = terminal(); }],
    ['ambiguous frame', v => v.frames.push(consoleView().frame)],
    ['another node', v => { v.anchor.nodename = 'other'; v.frame.contentWindow.location.href = v.frame.contentWindow.location.href.replace('node=pve', 'node=other'); }],
    ['hidden', v => { v.frame.visible = false; }],
]) test(`recipe refuses ${name} on copy without shell probing`, async () => {
    const v = consoleView();
    const h = host({ views: [v], enabledFeatures: ['RECIPES'] });
    h.action('Recipes').handler();
    change(v);
    await h.action('Copy command').handler();
    assert.deepEqual(h.copied, []);
    assert.deepEqual(v.term.sent, []);
    assert.match(h.action('Copy command').tooltip, /context changed/);
});

test('LXC picker disables node-only recipe and permits generic Linux recipe without installed-tool claims', async () => {
    const h = host({ views: [consoleView({ type: 'lxc' })], enabledFeatures: ['RECIPES'] });
    h.action('Recipes').handler();
    assert.equal(h.action('Copy command').disabled, true);
    await h.action('Copy command').handler();
    assert.deepEqual(h.copied, []);
    h.action('Next').handler();
    assert.equal(h.action('Copy command').disabled, false);
    await h.action('Copy command').handler();
    assert.deepEqual(h.copied, ['df -h']);
});

for (const edition of ['diagnostics', 'recipes']) {
    for (const contract of ['denied', 'void', 'timeout', 'promise', 'lease', 'close']) test(`${edition} copy contract ${contract}`, async () => {
        let finish, writes = 0;
        const h = host({ views: [consoleView()], enabledFeatures: [edition === 'diagnostics' ? 'DIAGNOSTICS' : 'RECIPES'], clipboard: () => {
            writes++;
            if (contract === 'denied') throw Error('PRIVATE');
            if (contract === 'void') return;
            return new Promise(resolve => { finish = resolve; });
        } });
        h.action(edition === 'diagnostics' ? 'Diagnostics' : 'Recipes').handler();
        const action = h.action(edition === 'diagnostics' ? 'Copy diagnostic report' : 'Copy command');
        const pending = action.handler();
        await action.handler();
        assert.equal(writes, 1);
        if (contract === 'promise') finish();
        if (contract === 'timeout') h.advance(5000);
        if (contract === 'lease') { h.document.documentElement.setAttribute('data-proxmox-toolkit-clipboard', 'other'); h.scan(); }
        if (contract === 'close') h.components.find(c => c.type === 'Ext.window.Window').destroy();
        await pending;
        if (contract !== 'close') assert.match(action.tooltip, {
            denied: /write failed/, void: /clipboard unconfirmed/, timeout: /completion not confirmed/,
            promise: /^Copied /, lease: /cancelled/,
        }[contract]);
        if (finish) { finish(); await Promise.resolve(); }
        if (contract === 'lease') assert.equal(h.document.documentElement.getAttribute('data-proxmox-toolkit-clipboard'), 'other');
        else assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'), false);
        if (contract === 'close') assert.equal(h.timers.size, 0);
        assert.equal(writes, 1);
    });
}

for (const utility of ['Export Console', 'Diagnostics', 'Recipes']) {
    for (const teardown of ['close', 'owner', 'menu', 'navigation', 'hidden']) test(`${utility} native lifecycle: ${teardown}`, () => {
        const h = host({ views: [consoleView()] });
        const opener = h.action(utility);
        opener.handler();
        const panel = h.components.find(c => c.type === 'Ext.window.Window');
        assert.ok(panel);
        if (utility === 'Export Console') h.action('Download plain text').handler();
        if (teardown === 'close') panel.destroy();
        if (teardown === 'owner') h.action('Copy').destroy();
        if (teardown === 'menu') h.action('Tools').destroy();
        if (teardown === 'navigation') h.events.hashchange();
        if (teardown === 'hidden') { h.document.hidden = true; h.events.visibilitychange(); }
        assert.equal(panel.destroyed, true);
        assert.equal(h.components.every(component => component.destroyCalls <= 1), true);
        assert.equal(h.timers.size, 0);
        assert.equal(h.blobs.size, 0);
        assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    });
}

test('panel callbacks reject navigation even before an event/scan; stale native callbacks cannot copy', async () => {
    const h = host({ views: [consoleView()], enabledFeatures: ['RECIPES'] });
    h.action('Recipes').handler();
    const copy = h.action('Copy command');
    h.context.location.hash = '#elsewhere';
    await copy.handler();
    assert.equal(copy.destroyed, true);
    await copy.handler();
    assert.deepEqual(h.copied, []);
});

test('strict Firefox adapter supports menu/panel callbacks without cloning native instances or exposing promises', async () => {
    const h = host({ views: [consoleView()], globals: {
        cloneInto(value) {
            assert.equal(Object.values(value).some(item => typeof item === 'function'), false);
            assert.equal(Object.values(value).some(item => item?.getEl), false);
            return { ...value };
        },
        exportFunction: callback => (...args) => callback(...args),
    } });
    const untrusted = new Proxy({}, { get() { throw Error('arguments must not be inspected'); } });
    assert.equal(h.action('Diagnostics').handler(untrusted), undefined);
    assert.equal(h.action('Copy diagnostic report').handler(untrusted), undefined);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(JSON.parse(h.copied[0]).schema, 'proxmox-toolkit-diagnostics/1');
    h.action('Tools').destroy();
    assert.equal(h.timers.size, 0);
});

test('idle and open-panel scans do not assemble reports, extract rows, read clipboard or rewrite unchanged controls', () => {
    let searches = 0, geometry = 0, rows = 0, reads = 0, infoReads = 0, updates = 0;
    const views = [consoleView(), consoleView({ node: 'other' })];
    for (const v of views) {
        v.root.querySelectorAll = () => { searches++; return v.frames; };
        const rect = v.frame.getBoundingClientRect;
        v.frame.getBoundingClientRect = function() { geometry++; return rect.call(this); };
        v.term.buffer.normal.getLine = () => { rows++; throw Error('idle extraction'); };
    }
    const info = {};
    Object.defineProperty(info, 'scriptHandler', { get() { infoReads++; return 'Violentmonkey'; } });
    const h = host({ views, globals: { GM_info: info }, readClipboard: () => { reads++; } });
    let before = h.Ext.queries;
    searches = geometry = 0;
    for (let i = 0; i < 100; i++) h.scan();
    assert.deepEqual([h.Ext.queries - before, searches, geometry, rows, reads, infoReads], [100, 200, 200, 0, 0, 0]);
    before = h.Ext.queries;
    h.action('Diagnostics').handler();
    assert.equal(h.Ext.queries - before, 1);
    assert.equal(infoReads, 1);
    h.action('Refresh').handler();
    assert.equal(h.Ext.queries - before, 2);
    assert.equal(infoReads, 2);
    for (const button of h.created) {
        const disabled = button.setDisabled, tooltip = button.setTooltip;
        button.setDisabled = function(v) { updates++; disabled.call(this, v); };
        button.setTooltip = function(v) { updates++; tooltip.call(this, v); };
    }
    h.scan(); // initialize native disabled state on new panel buttons
    updates = 0;
    before = h.Ext.queries;
    searches = geometry = 0;
    for (let i = 0; i < 100; i++) h.scan();
    assert.deepEqual([h.Ext.queries - before, searches, geometry, rows, reads, infoReads, updates], [100, 200, 200, 0, 0, 2, 0]);
    h.document.hidden = true;
    before = h.Ext.queries;
    for (let i = 0; i < 100; i++) h.scan();
    assert.equal(h.Ext.queries, before);
    assert.equal(h.timers.size, 0);
    assert.equal(h.intervals.length, 1);
    assert.equal(h.intervals[0].ms, 500);
});

for (const type of ['Ext.window.Window', 'Ext.form.field.TextArea', 'Ext.toolbar.Toolbar', 'Ext.button.Button']) {
    test(`partial panel creation failure at ${type} cleans up once`, () => {
        const h = host({ views: [consoleView()], enabledFeatures: ['EXPORT'] });
        const original = h.Ext.create;
        const existing = new Set(h.components);
        h.Ext.create = (name, config) => {
            if (name === type) throw Error('PRIVATE');
            return original(name, config);
        };
        h.action('Export Console').handler();
        assert.equal(h.components.filter(c => !existing.has(c)).every(c => c.destroyed && c.destroyCalls === 1), true);
        assert.match(h.action('Export Console').tooltip, /unavailable/);
        assert.doesNotMatch(JSON.stringify(h.warnings), /PRIVATE/);
        h.advance(1500);
        assert.equal(h.timers.size, 0);
    });
}

test('clipboard busy presentation does not rediscover every action before the activation read', async () => {
    let finish;
    const h = host({ views: [consoleView(), consoleView({ node: 'other' })],
        readClipboard: () => new Promise(resolve => { finish = resolve; }) });
    const before = h.Ext.queries;
    const pending = h.action('Paste Only').handler();
    assert.equal(h.Ext.queries - before, 1, 'only the activation session resolution precedes read');
    finish('test');
    await pending;
});
