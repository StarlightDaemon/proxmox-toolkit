const { test } = require('node:test');
const assert = require('node:assert/strict');
const { host, consoleView, element, row, buffer, terminal } = require('./helpers.cjs');

test('subframes do not register any polling or visibility listener', () => {
    const h = host({ subframe: true });
    assert.equal(h.intervals.length, 0);
    assert.deepEqual(h.events, {});
});
test('non-Proxmox pages do not query ExtJS', () => {
    assert.equal(host({ hasPVE: false }).Ext.queries, 0);
});
test('localized node and LXC controls each copy their own console', async () => {
    const node = consoleView({ text: 'node', label: 'Terminal local' });
    const lxc = consoleView({ type: 'lxc', text: 'guest', label: 'Konsole' });
    const h = host({ views: [node, lxc] });
    assert.equal(h.created.length, 4);
    assert.equal(node.toolbar.items.items[1], h.created[0]);
    await h.click(0);
    await h.click(1);
    assert.deepEqual(h.copied, ['node', 'guest']);
});
test('repeated scans create one ordinary stable-text pair of buttons', () => {
    const h = host({ views: [consoleView()] });
    for (let i = 0; i < 10; i++) h.scan();
    assert.equal(h.created.length, 2);
    assert.equal(h.created[0].text, 'Copy');
    assert.equal(h.created[1].text, 'Paste & Execute');
});
test('external destruction cleans up each button once using ExtJS event ordering', () => {
    for (const index of [0, 1]) {
        const h = host({ views: [consoleView()] });
        h.created[index].destroy();
        assert.deepEqual(h.created.map(button => button.destroyCalls), [1, 1]);
        assert.equal(h.api.controls.size, 0);
        h.scan();
        assert.equal(h.created.length, 4, 'a new pair can be installed after teardown');
    }
});
test('idle discovery resolves each console once and avoids unchanged button updates', () => {
    const views = [consoleView(), consoleView({ node: 'other' })];
    let searches = 0, geometry = 0, disabled = 0, tooltips = 0;
    for (const view of views) {
        view.root.querySelectorAll = () => { searches++; return view.frames; };
        const rect = view.frame.getBoundingClientRect;
        view.frame.getBoundingClientRect = function() { geometry++; return rect.call(this); };
    }
    const h = host({ views });
    for (const button of h.created) {
        const disable = button.setDisabled, tooltip = button.setTooltip;
        button.setDisabled = function(value) { disabled++; disable.call(this, value); };
        button.setTooltip = function(value) { tooltips++; tooltip.call(this, value); };
    }
    const queries = h.Ext.queries;
    searches = geometry = 0;
    for (let i = 0; i < 100; i++) h.scan();
    assert.equal(h.Ext.queries - queries, 100);
    assert.equal(searches, 200);
    assert.equal(geometry, 200);
    assert.equal(disabled, 0);
    assert.equal(tooltips, 0);
    views[0].frame.visible = false;
    h.scan();
    assert.equal(h.created[0].disabled, true);
    assert.equal(h.created[1].disabled, true);
    views[0].frame.visible = true;
    h.scan();
    assert.equal(h.created[0].disabled, false);
    assert.equal(h.created[1].disabled, false);
});

test('pending paste shares polling discovery without adding queries, DOM reads, or timers', async () => {
    const views = [consoleView(), consoleView({ node: 'other' })];
    let searches = 0, geometry = 0, styles = 0, resolve;
    for (const view of views) {
        view.root.querySelectorAll = () => { searches++; return view.frames; };
        const rect = view.frame.getBoundingClientRect;
        view.frame.getBoundingClientRect = function() { geometry++; return rect.call(this); };
    }
    const h = host({ views, readClipboard: () => new Promise(done => { resolve = done; }) });
    const computedStyle = h.context.getComputedStyle;
    h.context.getComputedStyle = element => { styles++; return computedStyle(element); };
    const pending = h.paste();
    const queries = h.Ext.queries;
    searches = geometry = styles = 0;
    for (let i = 0; i < 100; i++) h.scan();
    assert.deepEqual({ queries: h.Ext.queries - queries, searches, geometry, styles },
        { queries: 100, searches: 200, geometry: 200, styles: 200 });
    assert.equal(h.intervals.length, 1);
    assert.equal(h.intervals[0].ms, 500);
    assert.equal(h.timers.size, 1, 'one paste watchdog, no timer per scan');
    assert.equal(h.Ext.GlobalEvents.listeners.size, 1, 'one pending hide listener');
    resolve('echo toolkit');
    await pending;
    assert.deepEqual(views[0].term.sent, [{ paste: 'echo toolkit' }, { input: '\r' }]);
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    assert.equal(h.timers.size, 1, 'only feedback remains after completion');
    h.advance(1500);
    assert.equal(h.timers.size, 0);
});

test('hidden-page polling does no component or frame discovery', () => {
    const view = consoleView();
    const h = host({ views: [view] });
    const queries = h.Ext.queries;
    let searches = 0;
    view.root.querySelectorAll = () => { searches++; return view.frames; };
    h.document.hidden = true;
    for (let i = 0; i < 100; i++) h.scan();
    assert.equal(h.Ext.queries, queries);
    assert.equal(searches, 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.Ext.GlobalEvents.listeners.size, 0);
    assert.equal(h.intervals.length, 1, 'page-lifetime recovery interval stays bounded');
});
test('another script installation marker prevents duplicates', () => {
    const v = consoleView();
    v.toolbar.items.items.push({ pveCopyConsoleButton: true });
    assert.equal(host({ views: [v] }).created.length, 0);
});
test('unrelated controls cannot borrow a frame outside their owner', async () => {
    const empty = consoleView({ node: 'other' });
    empty.frames.length = 0;
    const actual = consoleView({ text: 'correct' });
    const h = host({ views: [empty, actual] });
    assert.equal(empty.toolbar.items.items.length, 1);
    assert.equal(h.created.length, 2);
    await h.click();
    assert.deepEqual(h.copied, ['correct']);
});
test('duplicate eligible frames fail closed, and recover when one disappears', async () => {
    const v = consoleView();
    const h = host({ views: [v] });
    const second = consoleView().frame;
    v.frames.push(second);
    h.scan();
    assert.equal(h.created[0].disabled, true);
    await h.click();
    assert.equal(h.copied.length, 0);
    v.frames.pop();
    h.scan();
    assert.equal(h.created[0].disabled, false);
});
test('a toolbar with two native console anchors is ambiguous', () => {
    const a = consoleView();
    const b = consoleView();
    b.anchor.up = () => a.toolbar;
    a.toolbar.items.items.push(b.anchor);
    assert.equal(host({ views: [a, b] }).created.length, 0);
});
test('an initializing second frame cannot cause an older ready console to be copied', async () => {
    const v = consoleView();
    const h = host({ views: [v] });
    const initializing = consoleView().frame;
    initializing.contentWindow.term = null;
    v.frames.push(initializing);
    await h.click();
    assert.equal(h.copied.length, 0);
    assert.equal(h.created[0].disabled, true);
});
test('click rechecks toolbar ambiguity before the next polling tick', async () => {
    const v = consoleView();
    const h = host({ views: [v] });
    const second = consoleView().anchor;
    second.up = () => v.toolbar;
    v.toolbar.items.items.push(second);
    h.anchors.push(second);
    await h.click();
    assert.equal(h.copied.length, 0);
    assert.equal(h.created[0].disabled, true);
});
for (const [name, change] of [
    ['wrong node', v => { v.frame.contentWindow.location.href = v.frame.contentWindow.location.href.replace('node=pve', 'node=other'); }],
    ['wrong guest', v => { v.anchor.consoleType = 'lxc'; v.frame.contentWindow.location.href = 'https://pve.example:8006/?console=lxc&node=pve&vmid=999&xtermjs=1'; }],
    ['wrong origin', v => { v.frame.contentWindow.location.href = v.frame.contentWindow.location.href.replace('pve.example', 'other.example'); }],
    ['remote console', v => { v.frame.contentWindow.location.href += '&remote=elsewhere'; }],
    ['noVNC', v => { v.frame.contentWindow.location.href = v.frame.contentWindow.location.href.replace('xtermjs=1', 'novnc=1'); }],
    ['hidden frame', v => { v.frame.visible = false; }],
    ['CSS-hidden frame', v => { v.frame.visibility = 'hidden'; }],
    ['detached frame', v => { v.frame.isConnected = false; }],
    ['hidden anchor', v => { v.anchor.visible = false; }],
    ['unsupported type', v => { v.anchor.consoleType = 'kvm'; }],
    ['missing identity', v => { delete v.anchor.nodename; }],
    ['inaccessible frame', v => { Object.defineProperty(v.frame, 'contentWindow', { get() { throw Error('blocked'); } }); }],
]) {
    test(`${name} does not install a copy button`, () => {
        const v = consoleView();
        change(v);
        assert.equal(host({ views: [v] }).created.length, 0);
    });
}
test('Firefox wrapped-object discovery survives a throwing direct getter', async () => {
    const v = consoleView({ text: 'wrapped' });
    v.frame.contentWindow.wrappedJSObject = { term: v.term };
    Object.defineProperty(v.frame.contentWindow, 'term', { get() { throw Error('wrapped'); } });
    const h = host({ views: [v] });
    await h.click();
    assert.deepEqual(h.copied, ['wrapped']);
});
test('copy rediscovers a replacement terminal and validates the live frame URL', async () => {
    const v = consoleView();
    const h = host({ views: [v] });
    v.frame.contentWindow.term = terminal('replacement');
    await h.click();
    assert.deepEqual(h.copied, ['replacement']);
    v.frame.contentWindow.location.href = 'https://pve.example:8006/?console=shell&node=other&xtermjs=1';
    await h.click();
    assert.equal(h.copied.length, 1);
});
test('empty and unavailable buffers leave clipboard untouched and give different feedback', async () => {
    const v = consoleView({ text: '   ' });
    const h = host({ views: [v] });
    await h.click();
    assert.equal(h.created[0].tooltip, 'Console buffer is empty');
    v.term.buffer.normal.getLine = undefined;
    await h.click();
    assert.equal(h.created[0].tooltip, 'Console buffer unavailable');
    assert.equal(h.copied.length, 0);
});
test('extraction exceptions are contained without logging sensitive error text', async () => {
    const v = consoleView();
    v.term.buffer.normal.getLine = () => { throw Error('SECRET'); };
    const h = host({ views: [v] });
    await h.click();
    assert.equal(h.created[0].tooltip, 'Console extraction failed');
    assert.equal(h.copied.length, 0);
    assert.equal(JSON.stringify(h.warnings).includes('SECRET'), false);
});
test('idle scans never read buffer rows and hidden pages do not discover components', () => {
    const v = consoleView();
    v.term.buffer.normal.getLine = () => { throw Error('must not be called'); };
    const h = host({ views: [v], hidden: true });
    h.scan();
    assert.equal(h.Ext.queries, 0);
    h.document.hidden = false;
    h.events.visibilitychange();
    assert.equal(h.created.length, 2);
    h.scan();
    assert.equal(h.warnings.length, 0);
});
test('unavailable controls disable and recover; destroyed views release state and timers', async () => {
    const v = consoleView();
    const h = host({ views: [v] });
    await h.click();
    v.frame.visible = false;
    h.scan();
    assert.equal(h.created[0].disabled, true);
    v.frame.visible = true;
    h.scan();
    assert.equal(h.created[0].disabled, false);
    v.toolbar.destroyed = true;
    h.scan();
    assert.equal(h.api.controls.size, 0);
    assert.equal(h.timers.size, 0);
});
test('insertion failure destroys partial controls and rate limits retry warnings', () => {
    const v = consoleView();
    v.toolbar.insert = () => { throw Error('insertion failed'); };
    const h = host({ views: [v] });
    h.scan();
    assert.equal(h.created.every(b => b.destroyed), true);
    assert.equal(h.api.controls.size, 0);
    assert.equal(h.warnings.length, 1);
    h.advance(30000);
    h.scan();
    assert.equal(h.warnings.length, 2);
});
test('component query failure disables existing controls and retries successfully', () => {
    const h = host({ views: [consoleView()] });
    const query = h.Ext.ComponentQuery.query;
    h.Ext.ComponentQuery.query = () => { throw Error('Ext rebuilding'); };
    h.scan();
    assert.equal(h.created[0].disabled, true);
    h.Ext.ComponentQuery.query = query;
    h.scan();
    assert.equal(h.created[0].disabled, false);
});
test('Unicode whitespace and wrapped interior ASCII spacing survive cleanup', () => {
    const result = host().api.extractBuffer(buffer([
        row('abc  '), row('def\u00a0  ', true), row(''), row('next\u2003 '), row('   '),
    ]));
    assert.equal(result.text, 'abc  def\u00a0\n\nnext\u2003');
    assert.equal(result.logicalLines, 3);
});
test('missing rows remain interior blanks; a retained first wrapped row remains text', () => {
    assert.equal(host().api.extractBuffer(buffer([row('fragment', true), undefined, row('end')])).text, 'fragment\n\nend');
});
test('normal scrollback and active alternate screen are selected explicitly', () => {
    const t = terminal('normal');
    t.buffer.alternate = buffer([row('alternate')]);
    const api = host().api;
    assert.equal(api.extractFullConsole(t).text, 'normal');
    t.buffer.active = t.buffer.alternate;
    assert.equal(api.extractFullConsole(t).text, 'alternate');
    assert.equal(api.extractFullConsole(t).alternateScreen, true);
});
test('malformed length is unavailable rather than an unbounded extraction loop', () => {
    assert.equal(host().api.extractBuffer({ length: Infinity, getLine() {} }), null);
});
test('legacy clipboard dispatch is honestly marked unconfirmed and shows buffer scope', async () => {
    const v = consoleView();
    v.term.buffer.active = v.term.buffer.alternate = buffer([row('screen')]);
    const h = host({ views: [v] });
    await h.click();
    assert.match(h.created[0].tooltip, /Sent 1 lines \(alternate screen\); clipboard unconfirmed/);
    assert.equal(h.created[0].iconCls, 'fa fa-info-circle');
});
test('Tampermonkey success waits for its callback; no duplicate write during pending operation', async () => {
    let callback, count = 0;
    const h = host({ views: [consoleView(), consoleView({ node: 'other' })], manager: 'Tampermonkey',
        clipboard(_text, type, cb) { assert.equal(type, undefined); callback = cb; count++; } });
    const pending = h.click();
    assert.equal(h.created[0].tooltip, 'Copying console buffer');
    assert.equal(h.created[0].disabled, false, 'keep the initiating control focusable');
    assert.equal(h.created[1].disabled, true);
    await h.click(1);
    assert.equal(count, 1);
    callback();
    await pending;
    assert.match(h.created[0].tooltip, /^Copied /);
    assert.equal(h.created[2].disabled, false);
});
test('promise-returning legacy APIs wait for completion', async () => {
    let complete;
    const h = host({ views: [consoleView()], clipboard: () => new Promise(resolve => { complete = resolve; }) });
    const pending = h.click();
    assert.equal(h.created[0].iconCls, 'fa fa-spinner');
    complete();
    await pending;
    assert.equal(h.created[0].iconCls, 'fa fa-check');
});
for (const [name, clipboard] of [
    ['throw', () => { throw Error('denied'); }],
    ['reject', () => Promise.reject(Error('denied'))],
]) test(`clipboard ${name} produces failure feedback without automatic retry`, async () => {
    const h = host({ views: [consoleView()], clipboard });
    await h.click();
    assert.equal(h.created[0].tooltip, 'Clipboard write failed');
    assert.equal(h.created[0].disabled, false);
});
test('missing callback times out as unconfirmed and ignores late completion', async () => {
    let done;
    const h = host({ views: [consoleView()], manager: 'Tampermonkey', clipboard(_text, _type, cb) { done = cb; } });
    const pending = h.click();
    h.advance(5000);
    await pending;
    assert.match(h.created[0].tooltip, /completion not confirmed/);
    done();
    assert.match(h.created[0].tooltip, /completion not confirmed/);
    assert.equal(h.created[0].disabled, false);
});
test('rapid completed clicks replace the previous feedback timer', async () => {
    const h = host({ views: [consoleView()] });
    await h.click();
    h.advance(1000);
    await h.click();
    h.advance(500);
    assert.equal(h.created[0].iconCls, 'fa fa-info-circle');
    h.advance(1000);
    assert.equal(h.created[0].iconCls, 'fa fa-copy');
    assert.equal(h.timers.size, 0);
});
test('destroy during a pending clipboard operation does not resurrect the old control', async () => {
    let done;
    const v = consoleView();
    const h = host({ views: [v], manager: 'Tampermonkey', clipboard(_text, _type, cb) { done = cb; } });
    const pending = h.click();
    v.toolbar.destroyed = true;
    h.scan();
    done();
    await pending;
    assert.equal(h.api.controls.size, 0);
    assert.equal(h.timers.size, 0);
});
test('focus returns only while focus and terminal identity are unchanged', async () => {
    const v = consoleView();
    const h = host({ views: [v] });
    h.document.activeElement = h.created[0].el;
    await h.click();
    assert.equal(v.term.focused, 1);
    h.document.activeElement = element();
    await h.click();
    assert.equal(v.term.focused, 1);
});
test('delayed completion cannot steal focus or focus a replacement terminal', async () => {
    let done;
    const v = consoleView();
    const h = host({ views: [v], manager: 'Tampermonkey', clipboard(_text, _type, cb) { done = cb; } });
    h.document.activeElement = h.created[0].el;
    const pending = h.click();
    h.document.activeElement = element();
    const replacement = terminal('new');
    v.frame.contentWindow.term = replacement;
    done();
    await pending;
    assert.equal(v.term.focused, 0);
    assert.equal(replacement.focused, 0);
});
