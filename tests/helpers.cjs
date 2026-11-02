const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'proxmox-copy-console.user.js'), 'utf8');
// The only instrumentation is an export inside the IIFE. No shipped test globals
// or duplicated extraction logic; startup and installed handlers execute normally.
const instrumented = source.replace(/\}\)\(\);\s*$/, `
    globalThis.probe = { extractBuffer, extractFullConsole, resolveConsole, controls };
})();`);
if (source === instrumented) throw new Error('Userscript export seam not found');

function buffer(rows) {
    return { length: rows.length, getLine: y => rows[y] };
}
function row(text, isWrapped = false) {
    return { length: text.length, isWrapped, translateToString: (_trim, start = 0, end = text.length) => text.slice(start, end) };
}
function terminal(text = 'retained output') {
    const normal = buffer([row(text)]);
    return { buffer: { normal, active: normal, alternate: buffer([]) }, focused: 0, focus() { this.focused++; },
        options: {}, modes: { bracketedPasteMode: true }, sent: [],
        paste(text) { this.sent.push({ paste: text }); }, input(text) { this.sent.push({ input: text }); } };
}
function element(extra = {}) {
    return {
        isConnected: true,
        visible: true,
        getBoundingClientRect() { return { width: this.visible ? 800 : 0, height: 400 }; },
        contains(other) { return this === other; },
        ...extra,
    };
}
function consoleView({ type = 'shell', node = 'pve', vmid = 101, text, label = 'Shell' } = {}) {
    const term = terminal(text);
    const url = `https://pve.example:8006/?console=${type}&node=${node}&vmid=${vmid}&xtermjs=1`;
    const frame = element({ contentWindow: { term, location: { href: url },
        states: { connected: 3 }, state: 3, socket: { readyState: 1 } } });
    const frames = [frame];
    const root = element({ querySelectorAll: () => frames });
    const owner = { getEl: () => ({ dom: root }) };
    const toolbar = {
        ownerCt: owner, items: { items: [] },
        insert(i, button) { this.items.items.splice(i, 0, button); button.toolbar = this; },
    };
    const anchor = {
        consoleType: type, nodename: node, vmid, text: label, visible: true,
        isVisible() { return this.visible; }, up: () => toolbar,
    };
    toolbar.items.items.push(anchor);
    return { anchor, toolbar, owner, root, frame, frames, term };
}
function host({ views = [], manager = 'Violentmonkey', clipboard, subframe = false, hidden = false, create, hasPVE = true,
    globals = {}, url = 'https://pve.example:8006/', exposure = 'unsafeWindow', readClipboard } = {}) {
    let now = 0, nextId = 0;
    const timers = new Map(), intervals = [], events = {}, copied = [], created = [], warnings = [];
    const anchors = views.map(v => v.anchor);
    const window = { addEventListener(name, fn) { events[name] = fn; } };
    window.self = window;
    window.top = subframe ? {} : window;
    const document = {
        hidden, activeElement: null, focused: true,
        hasFocus() { return this.focused; },
        addEventListener(name, fn) { events[name] = fn; },
    };
    const Ext = {
        queries: 0,
        GlobalEvents: {
            listeners: new Set(),
            on(name, fn) { if (name !== 'hide') throw Error('Unexpected event'); this.listeners.add(fn); },
            un(name, fn) { if (name !== 'hide') throw Error('Unexpected event'); this.listeners.delete(fn); },
            fireHide(component) { for (const fn of [...this.listeners]) fn(component); },
        },
        ComponentQuery: { query(selector) {
            if (selector !== 'pveConsoleButton') throw new Error('Unexpected broad query');
            Ext.queries++;
            return anchors;
        } },
        create(type, config) {
            if (create) return create(type, config);
            const el = element();
            const listeners = {};
            const b = {
                ...config, el, destroyCalls: 0,
                on(name, fn) { listeners[name] = fn; },
                getEl: () => ({ dom: el }),
                setDisabled(v) { this.disabled = v; },
                setIconCls(v) { this.iconCls = v; },
                setTooltip(v) { this.tooltip = v; },
                destroy() {
                    this.destroyCalls++;
                    this.destroying = true;
                    if (this.toolbar) this.toolbar.items.items = this.toolbar.items.items.filter(item => item !== this);
                    // ExtJS emits destroy before Ext.Base sets destroyed.
                    listeners.destroy?.();
                    this.destroying = false;
                    this.destroyed = true;
                },
            };
            created.push(b);
            return b;
        },
    };
    const context = {
        window, document, location: new URL(url), URL,
        navigator: { clipboard: { readText: readClipboard || (() => Promise.resolve('echo toolkit')) },
            userActivation: { isActive: true } },
        unsafeWindow: { Ext, PVE: hasPVE ? {} : undefined },
        getComputedStyle: el => ({ display: el.display || 'block', visibility: el.visibility || 'visible' }),
        GM_info: manager ? { scriptHandler: manager } : undefined,
        GM_setClipboard: clipboard === undefined ? (text => copied.push(text)) : clipboard,
        console: { log() {}, warn: (...args) => warnings.push(args), error: (...args) => warnings.push(args) },
        Date: { now: () => now },
        setInterval: (fn, ms) => { intervals.push({ fn, ms }); return ++nextId; },
        setTimeout: (fn, ms) => { const id = ++nextId; timers.set(id, { fn, at: now + ms }); return id; },
        clearTimeout: id => timers.delete(id),
    };
    if (exposure === 'wrapped') {
        window.wrappedJSObject = context.unsafeWindow;
        delete context.unsafeWindow;
    } else if (exposure === 'page') {
        Object.assign(window, context.unsafeWindow);
        delete context.unsafeWindow;
    }
    Object.assign(context, globals);
    vm.runInNewContext(instrumented, context, { filename: 'proxmox-copy-console.user.js' });
    return {
        api: context.probe, document, context, Ext, events, timers, intervals, copied, created, warnings, anchors,
        scan() { intervals[0]?.fn(); },
        advance(ms) {
            now += ms;
            for (const [id, timer] of [...timers]) {
                if (timer.at <= now && timers.delete(id)) timer.fn();
            }
        },
        click(index = 0) { return created.filter(button => button.text === 'Copy')[index].handler(); },
        paste(index = 0) { return created.filter(button => button.text === 'Paste & Execute')[index].handler(); },
    };
}

module.exports = { source, host, consoleView, element, row, buffer, terminal };
