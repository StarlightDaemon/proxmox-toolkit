const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'proxmox-toolkit.user.js'), 'utf8');
// The only instrumentation is an export inside the IIFE. No shipped test globals
// or duplicated extraction logic; startup and installed handlers execute normally.
function instrument(text) { return text.replace(/\}\)\(\);\s*$/, `
    globalThis.probe = { extractBuffer: typeof extractBuffer === 'function' ? extractBuffer : undefined,
        extractFullConsole: typeof extractFullConsole === 'function' ? extractFullConsole : undefined,
        diagnosticReport: typeof diagnosticReport === 'function' ? diagnosticReport : undefined,
        exportContent: typeof exportContent === 'function' ? exportContent : undefined,
        scopedConsole: typeof scopedConsole === 'function' ? scopedConsole : undefined,
        findConsoleLines: typeof findConsoleLines === 'function' ? findConsoleLines : undefined,
        featureEnabled: typeof featureEnabled === 'function' ? featureEnabled : undefined,
        normalizeSettings: typeof normalizeSettings === 'function' ? normalizeSettings : undefined,
        openToolkitSettings: typeof openToolkitSettings === 'function' ? openToolkitSettings : undefined,
        openCatalogReport: typeof openCatalogReport === 'function' ? openCatalogReport : undefined,
        createReportClient: typeof createReportClient === 'function' ? createReportClient : undefined,
        CatalogModel: typeof CatalogModel === 'object' ? CatalogModel : undefined,
        resolveConsole, controls };
})();`);
}

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
    const attrs = new Map(), listeners = new Map();
    return {
        isConnected: true,
        visible: true,
        getBoundingClientRect() { return { width: this.visible ? 800 : 0, height: 400 }; },
        contains(other) { return this === other; },
        getAttribute(name) { return attrs.get(name) ?? null; },
        setAttribute(name, value) { attrs.set(name, value); },
        removeAttribute(name) { attrs.delete(name); },
        addEventListener(name, fn) { listeners.set(name, fn); },
        removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
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
    globals = {}, url = 'https://pve.example:8006/', exposure = 'unsafeWindow', readClipboard, edition = 'toolkit', enabledFeatures, headerReady = true, freshSettings = false } = {}) {
    let now = 0, nextId = 0;
    const timers = new Map(), intervals = [], events = {}, copied = [], created = [], warnings = [], components = [];
    const blobs = new Map(), revoked = [], downloads = [], domAnchors = [];
    const anchors = views.map(v => v.anchor);
    const nativeRoot = element();
    const contentListeners = new Map();
    const content = { items: { items: [{ getEl: () => ({ dom: nativeRoot }) }] },
        isVisible: () => true, getWidth: () => 800, getHeight: () => 600,
        getEl: () => ({ dom: element() }),
        on(event, fn) { contentListeners.set(event, fn); },
        un(event, fn) { if (contentListeners.get(event) === fn) contentListeners.delete(event); },
        fire(event) { contentListeners.get(event)?.(); } };
    const workspace = { child: selector => selector === '#content' ? content : null, down: () => null };
    const header = { region: 'north', ownerCt: workspace, items: { items: [] },
        insert(i, button) { this.items.items.splice(i, 0, button); button.toolbar = this; } };
    const help = { ownerCt: header, up: selector => selector === 'pveStdWorkspace' ? workspace : null,
        isVisible: () => true, text: 'Dokumentation' };
    header.items.items.push(help);
    const helpButtons = headerReady ? [help] : [];
    function listen(name, fn) {
        const previous = events[name];
        events[name] = previous ? (...args) => { previous(...args); fn(...args); } : fn;
    }
    const attributes = new Map();
    const window = { addEventListener: listen, innerWidth: 1024, innerHeight: 768 };
    window.self = window;
    window.top = subframe ? {} : window;
    const document = {
        hidden, activeElement: null, focused: true,
        hasFocus() { return this.focused; },
        addEventListener: listen,
        body: { appendChild(anchor) { anchor.isConnected = true; } },
        createElement(tag) {
            if (tag !== 'a') throw Error('Unexpected element');
            const anchor = { remove() { this.isConnected = false; }, click() { downloads.push({ href: this.href, filename: this.download, blob: blobs.get(this.href) }); } };
            domAnchors.push(anchor);
            return anchor;
        },
        documentElement: {
            hasAttribute: name => attributes.has(name), getAttribute: name => attributes.get(name) ?? null,
            setAttribute: (name, value) => attributes.set(name, value), removeAttribute: name => attributes.delete(name),
        },
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
            if (selector === 'proxmoxHelpButton') return helpButtons;
            if (selector !== 'pveConsoleButton') throw new Error('Unexpected broad query');
            Ext.queries++;
            return anchors;
        } },
        create(type, config) {
            if (create && !config.tooltip?.endsWith(' settings')) return create(type, config);
            const el = element();
            const listeners = {};
            const b = {
                ...config, el, destroyCalls: 0, type, children: [], items: { items: [] },
                add(child) { this.children.push(child); this.items.items.push(child); return child; },
                addDocked(child) { return this.add(child); },
                setMenu(menu) { this.menu = menu; this.children.push(menu); },
                setValue(value) { this.value = value; },
                getValue() { return this.value ?? this.checked; },
                setActiveTab(tab) { this.activeTab = tab; },
                focus() {},
                setReadOnly(value) { this.readOnly = value; },
                show() { this.visible = true; },
                render(parent) { this.renderedTo = parent; },
                up(selector) { return selector === 'pveStdWorkspace' && this.toolbar === header ? workspace : null; },
                setSize(width, height) { this.width = width; this.height = height; },
                on(name, fn) { listeners[name] = fn; },
                getEl: () => ({ dom: el }),
                setDisabled(v) { this.disabled = v; },
                setIconCls(v) { this.iconCls = v; },
                setTooltip(v) { this.tooltip = v; },
                destroy() {
                    this.destroyCalls++;
                    this.destroying = true;
                    for (const child of this.children) if (!child.destroyed && !child.destroying) child.destroy();
                    if (this.toolbar) this.toolbar.items.items = this.toolbar.items.items.filter(item => item !== this);
                    // ExtJS emits destroy before Ext.Base sets destroyed.
                    listeners.destroy?.();
                    this.destroying = false;
                    this.destroyed = true;
                },
            };
            components.push(b);
            if ((type === 'Ext.button.Button' || type === 'Ext.menu.Item') && !config.tooltip?.endsWith(' settings')) created.push(b);
            return b;
        },
    };
    const context = {
        window, document, location: new URL(url), Blob, AbortController, TextDecoder,
        URL: class extends URL {
            static createObjectURL(blob) { const id = `blob:test-${++nextId}`; blobs.set(id, blob); return id; }
            static revokeObjectURL(id) { revoked.push(id); blobs.delete(id); }
        }, crypto: require('node:crypto').webcrypto,
        navigator: { clipboard: { readText: readClipboard || (() => Promise.resolve('echo toolkit')) },
            userActivation: { isActive: true } },
        unsafeWindow: { Ext, PVE: hasPVE ? {} : undefined },
        getComputedStyle: el => ({ display: el.display || 'block', visibility: el.visibility || 'visible' }),
        GM_info: manager ? { scriptHandler: manager } : undefined,
        GM_setClipboard: clipboard === undefined ? (text => copied.push(text)) : clipboard,
        console: { log() {}, warn: (...args) => warnings.push(args), error: (...args) => warnings.push(args) },
        Date: class extends Date { constructor(...args) { super(...(args.length ? args : ['2026-11-02T18:30:00Z'])); } static now() { return now; } },
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
    // Existing console regressions exercise the six-action opt-in configuration.
    // Fresh-install/default tests explicitly bypass this saved fixture. Never
    // override a supplied storage implementation (including async/error tests).
    if (!freshSettings && !enabledFeatures && !context.GM_getValue && !context.GM?.getValue)
        enabledFeatures = ['COPY', 'PASTE_ONLY', 'PASTE', 'EXPORT', 'DIAGNOSTICS', 'RECIPES'];
    if (enabledFeatures) context.GM_getValue = () => ({ schema: 1, features: Object.fromEntries(
        require('../tools/features.cjs').features.map(f => [f.id, enabledFeatures.includes(f.id)])) });
    function installEdition(id, overrides = {}) {
        const config = require('../tools/editions.json').editions.find(item => item.id === id);
        if (!config) throw Error(`Unknown edition: ${id}`);
        const text = fs.readFileSync(path.join(__dirname, '..', config.file), 'utf8');
        const sandbox = { ...context, ...overrides };
        vm.runInNewContext(instrument(text), sandbox, { filename: config.file });
        return sandbox;
    }
    const initial = installEdition(edition);
    return {
        api: initial.probe, document, context: initial, Ext, events, timers, intervals, copied, created, warnings, anchors, installEdition,
        components, blobs, revoked, downloads, domAnchors, header, help, helpButtons, content, nativeRoot, contentListeners,
        action(text, index = 0) { return created.filter(button => button.text === text && !button.destroyed)[index]; },
        scan() { for (const interval of intervals) interval.fn(); },
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
