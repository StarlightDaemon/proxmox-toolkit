const { test } = require('node:test');
const assert = require('node:assert/strict');
const { host, consoleView } = require('./helpers.cjs');

for (const url of [
    'http://pve.example:8006/', 'https://pve.example/', 'https://pve.example:8007/',
    'https://other.example/path/pve:8006/', 'https://pve.example:8006@other.example/',
]) test(`URL guard prevents startup on ${url}`, () => {
    const h = host({ views: [consoleView()], url });
    assert.equal(h.intervals.length, 0);
    assert.equal(h.created.length, 0);
});

for (const exposure of ['wrapped', 'page']) test(`${exposure} page globals work without unsafeWindow`, async () => {
    const h = host({ views: [consoleView()], exposure });
    await h.click();
    assert.deepEqual(h.copied, ['retained output']);
});

for (const returnsPromise of [false, true]) test(`modern clipboard preserves receiver and reports ${returnsPromise ? 'completion' : 'dispatch'}`, async () => {
    const writes = [];
    const GM = {
        info: { scriptHandler: 'Greasemonkey' },
        setClipboard(text) {
            assert.equal(this, GM);
            assert.equal(arguments.length, 1);
            writes.push(text);
            return returnsPromise ? Promise.resolve() : undefined;
        },
    };
    const h = host({ views: [consoleView()], manager: null, clipboard: null, globals: { GM } });
    await h.click();
    assert.deepEqual(writes, ['retained output']);
    assert.match(h.created[0].tooltip, returnsPromise ? /^Copied / : /clipboard unconfirmed$/);
    assert.equal(h.timers.size, 1, 'only the feedback timer remains');
});

test('modern rejection is contained without leaking the exception', async () => {
    let calls = 0;
    const h = host({ views: [consoleView()], clipboard: null,
        globals: { GM: { setClipboard() { calls++; return Promise.reject(Error('SECRET')); } } } });
    await h.click();
    assert.equal(calls, 1);
    assert.equal(h.created[0].tooltip, 'Clipboard write failed');
    assert.equal(JSON.stringify(h.warnings).includes('SECRET'), false);
});

test('pending modern API times out and late completion cannot change feedback', async () => {
    let complete;
    const h = host({ views: [consoleView()], clipboard: null,
        globals: { GM: { setClipboard: () => new Promise(resolve => { complete = resolve; }) } } });
    const pending = h.click();
    h.advance(5000);
    await pending;
    assert.match(h.created[0].tooltip, /completion not confirmed/);
    complete();
    await Promise.resolve();
    assert.match(h.created[0].tooltip, /completion not confirmed/);
});

test('legacy API is preferred and its failure never triggers a second write', async () => {
    let legacy = 0, modern = 0;
    const h = host({ views: [consoleView()],
        clipboard() { legacy++; throw Error('denied'); },
        globals: { GM: { setClipboard() { modern++; } } } });
    await h.click();
    assert.equal(legacy, 1);
    assert.equal(modern, 0);
    assert.equal(h.created[0].tooltip, 'Clipboard write failed');
});

test('modern manager info can identify the legacy Tampermonkey callback contract', async () => {
    let complete;
    const h = host({ views: [consoleView()], manager: null,
        clipboard(_text, _type, cb) { complete = cb; },
        globals: { GM: { info: { scriptHandler: 'Tampermonkey' } } } });
    const pending = h.click();
    assert.equal(typeof complete, 'function');
    complete();
    await pending;
    assert.match(h.created[0].tooltip, /^Copied /);
});

test('missing clipboard capability fails without a native clipboard fallback', async () => {
    const h = host({ views: [consoleView()], clipboard: null });
    await h.click();
    assert.equal(h.created[0].tooltip, 'Clipboard write failed');
    assert.equal(h.copied.length, 0);
});

test('Firefox sharing adapter exports both callbacks without returning privileged promises', async () => {
    const targets = [], shared = [];
    const v = consoleView();
    const h = host({ views: [v], globals: {
        cloneInto(options, target, settings) {
            assert.equal(settings.cloneFunctions, true);
            targets.push(target);
            shared.push(options);
            return { ...options };
        },
    } });
    assert.equal(shared.length, 4, 'configuration and destroy callback for each action are shared');
    assert.equal(targets.every(t => t === h.context.unsafeWindow), true);
    assert.equal(h.click(), undefined, 'no sandbox Promise crosses into the page');
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(h.copied, ['retained output']);
    h.created[0].destroy();
    assert.equal(h.api.controls.size, 0);
    assert.equal(h.timers.size, 0);
});

test('unavailable Firefox sharing does not silently inject or evaluate page code', () => {
    const h = host({ views: [consoleView()], globals: { cloneInto() { throw Error('blocked'); } } });
    assert.equal(h.created.length, 0);
    assert.equal(h.warnings.length, 1);
    assert.equal(h.copied.length, 0);
});

test('discovery avoids page-array filter and some callbacks under strict compartments', async () => {
    const view = consoleView();
    const views = [view];
    const rejectCallback = () => { throw Error('page cannot invoke sandbox callback'); };
    views.map = fn => {
        const anchors = Array.prototype.map.call(views, fn);
        anchors.filter = rejectCallback;
        return anchors;
    };
    view.toolbar.items.items.some = rejectCallback;
    const h = host({ views });
    assert.equal(h.created.length, 2);
    assert.equal(h.warnings.length, 0);
    h.scan();
    assert.equal(h.created.length, 2, 'repeated discovery does not duplicate controls');
    await h.click();
    assert.deepEqual(h.copied, ['retained output']);
});

test('explicit Firefox exports work without function cloning and contain callback return values', async () => {
    const targets = [], exports = [];
    const h = host({ views: [consoleView()], globals: {
        cloneInto(value, target, settings) {
            assert.equal(settings, undefined, 'never request the failing cloneFunctions path');
            assert.equal(Object.values(value).some(item => typeof item === 'function'), false);
            targets.push(target);
            return { ...value };
        },
        exportFunction(callback, target) {
            targets.push(target);
            exports.push(callback);
            return (...args) => callback(...args);
        },
    } });
    assert.equal(exports.length, 4, 'copy, paste, and both destroy handlers are exported');
    assert.equal(targets.every(target => target === h.context.unsafeWindow), true);
    const untrustedArgument = new Proxy({}, { get() { throw Error('must not inspect page arguments'); } });
    assert.equal(h.created[0].handler(untrustedArgument), undefined);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(h.copied, ['retained output']);
    h.created[0].destroy();
    assert.equal(h.api.controls.size, 0);
    assert.equal(h.timers.size, 0);
});

test('failed explicit export is contained without fallback or clipboard writes', () => {
    let clones = 0, exports = 0;
    const h = host({ views: [consoleView()], globals: {
        cloneInto(value) { clones++; return { ...value }; },
        exportFunction() { exports++; throw Error('PRIVATE FAILURE'); },
    } });
    assert.equal(clones, 1);
    assert.equal(exports, 1);
    assert.equal(h.created.length, 0);
    assert.equal(h.copied.length, 0);
    assert.equal(h.warnings.length, 1);
    assert.equal(JSON.stringify(h.warnings).includes('PRIVATE'), false);
});
